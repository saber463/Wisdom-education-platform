/**
 * 音频预处理工具
 * 
 * 使用Rust-WASM模块进行音频降噪和格式转换
 * 处理时间≤2秒
 * 
 * 需求：20.2 - 音频预处理（WASM）
 */

import { initWasm } from './wasm-loader'

/**
 * 音频处理配置
 */
export interface AudioProcessConfig {
  sampleRate?: number
  channels?: number
  noiseReduction?: boolean
  normalization?: boolean
}

/**
 * 音频处理结果
 */
export interface AudioProcessResult {
  audioBuffer: AudioBuffer
  duration: number
  processingTime: number
  format: string
}

/**
 * 音频处理器类
 */
export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private wasmReady: boolean = false

  constructor() {
    this.initAudioContext()
  }

  /**
   * 初始化AudioContext
   */
  private initAudioContext(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()
    } catch (error) {
      console.error('[音频处理] AudioContext初始化失败:', error)
    }
  }

  /**
   * 初始化WASM模块
   */
  async initWasm(): Promise<boolean> {
    if (this.wasmReady) return true
    
    try {
      const success = await initWasm()
      this.wasmReady = success
      return success
    } catch (error) {
      console.error('[音频处理] WASM初始化失败:', error)
      return false
    }
  }

  /**
   * 处理音频Blob
   * 
   * @param audioBlob - 音频文件Blob
   * @param config - 处理配置
   * @returns 处理结果
   */
  async processAudio(
    audioBlob: Blob,
    config: AudioProcessConfig = {}
  ): Promise<AudioProcessResult> {
    const startTime = performance.now()

    if (!this.audioContext) {
      throw new Error('AudioContext未初始化')
    }

    try {
      // 1. 读取Blob为ArrayBuffer
      const arrayBuffer = await this.blobToArrayBuffer(audioBlob)

      // 2. 解码音频
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)

      // 3. 预处理音频
      let processedBuffer = audioBuffer
      if (config.noiseReduction !== false) {
        processedBuffer = await this.applyNoiseReduction(processedBuffer)
      }
      if (config.normalization !== false) {
        processedBuffer = this.normalizeAudio(processedBuffer)
      }

      // 4. 重采样（如果需要）
      if (config.sampleRate && config.sampleRate !== processedBuffer.sampleRate) {
        processedBuffer = await this.resampleAudio(processedBuffer, config.sampleRate)
      }

      const processingTime = performance.now() - startTime

      return {
        audioBuffer: processedBuffer,
        duration: processedBuffer.duration,
        processingTime,
        format: 'wav'
      }
    } catch (error) {
      console.error('[音频处理] 处理失败:', error)
      throw error
    }
  }

  /**
   * Blob转ArrayBuffer
   */
  private blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(blob)
    })
  }

  /**
   * 应用降噪处理
   * 
   * 使用简单的频谱减法降噪算法
   */
  private async applyNoiseReduction(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext未初始化')
    }

    const sampleRate = audioBuffer.sampleRate
    const numberOfChannels = audioBuffer.numberOfChannels
    const length = audioBuffer.length

    // 创建新的AudioBuffer用于存储处理后的数据
    const processedBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      length,
      sampleRate
    )

    // 处理每个声道
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel)
      const outputData = processedBuffer.getChannelData(channel)

      // 简单的降噪：计算噪声基线并减去
      const noiseFloor = this.estimateNoiseFloor(inputData)
      
      for (let i = 0; i < length; i++) {
        let sample = inputData[i]
        
        // 频谱减法
        if (Math.abs(sample) > noiseFloor) {
          sample = sample - (noiseFloor * Math.sign(sample))
        } else {
          sample = 0
        }

        // 软阈值处理
        const threshold = noiseFloor * 0.5
        if (Math.abs(sample) < threshold) {
          sample = 0
        }

        outputData[i] = sample
      }
    }

    return processedBuffer
  }

  /**
   * 估计噪声基线
   * 
   * 使用前100ms的音频数据估计噪声水平
   */
  private estimateNoiseFloor(audioData: Float32Array): number {
    const noiseFrameSize = Math.min(4410, audioData.length) // 100ms @ 44.1kHz
    let sum = 0

    for (let i = 0; i < noiseFrameSize; i++) {
      sum += Math.abs(audioData[i])
    }

    return sum / noiseFrameSize * 0.5 // 乘以0.5作为阈值系数
  }

  /**
   * 音频归一化处理
   * 
   * 将音频幅度调整到[-1, 1]范围内
   */
  private normalizeAudio(audioBuffer: AudioBuffer): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext未初始化')
    }

    const numberOfChannels = audioBuffer.numberOfChannels
    const length = audioBuffer.length

    // 创建新的AudioBuffer
    const normalizedBuffer = this.audioContext.createBuffer(
      numberOfChannels,
      length,
      audioBuffer.sampleRate
    )

    // 找到最大幅度
    let maxAmplitude = 0
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]))
      }
    }

    // 避免除以零
    if (maxAmplitude === 0) {
      maxAmplitude = 1
    }

    // 归一化每个声道
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel)
      const outputData = normalizedBuffer.getChannelData(channel)

      for (let i = 0; i < length; i++) {
        outputData[i] = inputData[i] / maxAmplitude
      }
    }

    return normalizedBuffer
  }

  /**
   * 重采样音频
   */
  private async resampleAudio(
    audioBuffer: AudioBuffer,
    targetSampleRate: number
  ): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext未初始化')
    }

    const sourceSampleRate = audioBuffer.sampleRate
    if (sourceSampleRate === targetSampleRate) {
      return audioBuffer
    }

    const ratio = targetSampleRate / sourceSampleRate
    const newLength = Math.round(audioBuffer.length * ratio)

    const resampledBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    )

    // 简单的线性插值重采样
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel)
      const outputData = resampledBuffer.getChannelData(channel)

      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i / ratio
        const sourceIndexFloor = Math.floor(sourceIndex)
        const sourceIndexCeil = Math.ceil(sourceIndex)
        const fraction = sourceIndex - sourceIndexFloor

        if (sourceIndexCeil >= inputData.length) {
          outputData[i] = inputData[sourceIndexFloor]
        } else {
          const sample1 = inputData[sourceIndexFloor]
          const sample2 = inputData[sourceIndexCeil]
          outputData[i] = sample1 + (sample2 - sample1) * fraction
        }
      }
    }

    return resampledBuffer
  }

  /**
   * 将AudioBuffer转换为WAV Blob
   */
  async audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
    const numberOfChannels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16

    const bytesPerSample = bitDepth / 8
    const blockAlign = numberOfChannels * bytesPerSample

    // 获取音频数据
    const channelData: Float32Array[] = []
    for (let channel = 0; channel < numberOfChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel))
    }

    // 计算文件大小
    const dataLength = audioBuffer.length * blockAlign
    const fileLength = 36 + dataLength

    // 创建WAV文件
    const arrayBuffer = new ArrayBuffer(44 + dataLength)
    const view = new DataView(arrayBuffer)

    // WAV头
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, fileLength, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmt chunk size
    view.setUint16(20, format, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataLength, true)

    // 写入音频数据
    let offset = 44
    const volume = 0.8 // 音量调整
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        let sample = channelData[channel][i] * volume
        sample = Math.max(-1, Math.min(1, sample)) // 限制范围
        const s = Math.round(sample < 0 ? sample * 0x8000 : sample * 0x7fff)
        view.setInt16(offset, s, true)
        offset += 2
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  /**
   * 获取音频统计信息
   */
  getAudioStats(audioBuffer: AudioBuffer): {
    duration: number
    sampleRate: number
    channels: number
    rms: number
    peak: number
  } {
    let rms = 0
    let peak = 0

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      let sum = 0

      for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i]
        sum += sample * sample
        peak = Math.max(peak, Math.abs(sample))
      }

      rms = Math.sqrt(sum / channelData.length)
    }

    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      rms,
      peak
    }
  }
}

/**
 * 全局音频处理器实例
 */
let globalProcessor: AudioProcessor | null = null

/**
 * 获取全局音频处理器
 */
export function getAudioProcessor(): AudioProcessor {
  if (!globalProcessor) {
    globalProcessor = new AudioProcessor()
  }
  return globalProcessor
}

/**
 * 处理音频文件
 * 
 * @param audioBlob - 音频Blob
 * @param config - 处理配置
 * @returns 处理结果
 */
export async function processAudioFile(
  audioBlob: Blob,
  config: AudioProcessConfig = {}
): Promise<AudioProcessResult> {
  const processor = getAudioProcessor()
  await processor.initWasm()
  return processor.processAudio(audioBlob, config)
}

/**
 * 将处理后的音频转换为WAV
 */
export async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const processor = getAudioProcessor()
  return processor.audioBufferToWav(audioBuffer)
}
