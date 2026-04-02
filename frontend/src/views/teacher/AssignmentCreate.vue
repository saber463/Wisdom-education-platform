<template>
  <TeacherLayout>
    <div class="assignment-create-page">
      <div class="page-header">
        <el-button
          :icon="ArrowLeft"
          @click="goBack"
        >
          返回
        </el-button>
        <h2>创建作业</h2>
      </div>

      <el-card class="form-card">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          class="assignment-form"
        >
          <el-divider content-position="left">
            基本信息
          </el-divider>
          
          <el-form-item
            label="作业标题"
            prop="title"
          >
            <el-input
              v-model="formData.title"
              placeholder="请输入作业标题"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item
            label="作业描述"
            prop="description"
          >
            <el-input
              v-model="formData.description"
              type="textarea"
              placeholder="请输入作业描述"
              :rows="3"
            />
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                label="所属班级"
                prop="classId"
              >
                <el-select
                  v-model="formData.classId"
                  placeholder="请选择班级"
                  style="width: 100%"
                >
                  <el-option
                    v-for="cls in classList"
                    :key="cls.id"
                    :label="cls.name"
                    :value="cls.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="难度等级"
                prop="difficulty"
              >
                <el-select
                  v-model="formData.difficulty"
                  placeholder="请选择难度"
                  style="width: 100%"
                >
                  <el-option
                    label="基础"
                    value="basic"
                  />
                  <el-option
                    label="中等"
                    value="medium"
                  />
                  <el-option
                    label="提高"
                    value="advanced"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                label="截止时间"
                prop="deadline"
              >
                <el-date-picker
                  v-model="formData.deadline"
                  type="datetime"
                  placeholder="请选择截止时间"
                  style="width: 100%"
                  :disabled-date="disabledDate"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                label="总分"
                prop="totalScore"
              >
                <el-input-number
                  v-model="formData.totalScore"
                  :min="1"
                  :max="1000"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">
            题目列表
          </el-divider>
          
          <div class="questions-section">
            <div
              v-for="(question, index) in formData.questions"
              :key="index"
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">第 {{ index + 1 }} 题</span>
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  :disabled="formData.questions.length <= 1"
                  @click="removeQuestion(index)"
                >
                  删除
                </el-button>
              </div>
              
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item
                    :prop="`questions.${index}.questionType`"
                    :rules="[{ required: true, message: '请选择题型', trigger: 'change' }]"
                    label="题型"
                  >
                    <el-select
                      v-model="question.questionType"
                      placeholder="选择题型"
                      style="width: 100%"
                    >
                      <el-option
                        label="选择题"
                        value="choice"
                      />
                      <el-option
                        label="填空题"
                        value="fill"
                      />
                      <el-option
                        label="判断题"
                        value="judge"
                      />
                      <el-option
                        label="主观题"
                        value="subjective"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item
                    :prop="`questions.${index}.score`"
                    :rules="[{ required: true, message: '请输入分值', trigger: 'blur' }]"
                    label="分值"
                  >
                    <el-input-number
                      v-model="question.score"
                      :min="1"
                      :max="100"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="知识点">
                    <el-select
                      v-model="question.knowledgePointId"
                      placeholder="选择知识点"
                      clearable
                      style="width: 100%"
                    >
                      <el-option
                        v-for="kp in knowledgePoints"
                        :key="kp.id"
                        :label="kp.name"
                        :value="kp.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item
                :prop="`questions.${index}.questionContent`"
                :rules="[{ required: true, message: '请输入题目内容', trigger: 'blur' }]"
                label="题目内容"
              >
                <el-input
                  v-model="question.questionContent"
                  type="textarea"
                  placeholder="请输入题目内容"
                  :rows="2"
                />
              </el-form-item>
              
              <el-form-item
                v-if="isObjectiveQuestion(question.questionType)"
                :prop="`questions.${index}.standardAnswer`"
                :rules="[{ required: true, message: '客观题必须提供标准答案', trigger: 'blur' }]"
                label="标准答案"
              >
                <el-input
                  v-model="question.standardAnswer"
                  placeholder="请输入标准答案（客观题必填）"
                />
              </el-form-item>
              
              <el-form-item
                v-else
                label="参考答案"
              >
                <el-input
                  v-model="question.standardAnswer"
                  type="textarea"
                  placeholder="请输入参考答案（主观题可选）"
                  :rows="2"
                />
              </el-form-item>
            </div>
            
            <el-button
              type="primary"
              plain
              :icon="Plus"
              @click="addQuestion"
            >
              添加题目
            </el-button>
          </div>

          <el-divider />
          
          <div class="form-actions">
            <el-button @click="goBack">
              取消
            </el-button>
            <el-button
              type="info"
              :loading="saving"
              @click="handleSaveDraft"
            >
              保存草稿
            </el-button>
            <el-button
              type="primary"
              :loading="saving"
              @click="handleSubmit"
            >
              创建并发布
            </el-button>
          </div>
        </el-form>
      </el-card>
    </div>
  </TeacherLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
import TeacherLayout from '@/components/TeacherLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref<FormInstance>()
const saving = ref(false)
const classList = ref<Array<{ id: number; name: string }>>([])
const knowledgePoints = ref<Array<{ id: number; name: string }>>([])

interface Question {
  questionType: 'choice' | 'fill' | 'judge' | 'subjective' | ''
  questionContent: string
  standardAnswer: string
  score: number
  knowledgePointId: number | null
}

const formData = reactive({
  title: '',
  description: '',
  classId: null as number | null,
  difficulty: 'medium' as 'basic' | 'medium' | 'advanced',
  deadline: null as Date | null,
  totalScore: 100,
  questions: [{ questionType: '' as Question['questionType'], questionContent: '', standardAnswer: '', score: 10, knowledgePointId: null as number | null }] as Question[]
})

const formRules: FormRules = {
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }, { min: 2, max: 200, message: '标题长度在2-200个字符', trigger: 'blur' }],
  classId: [{ required: true, message: '请选择班级', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度等级', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
  totalScore: [{ required: true, message: '请输入总分', trigger: 'blur' }]
}

async function fetchClasses() {
  try {
    const response = await request.get<{ classes?: Array<{ id: number; name: string }> }>('/classes')
    classList.value = response.classes || []
  } catch (error) { console.error('[创建作业] 获取班级列表失败:', error) }
}

async function fetchKnowledgePoints() {
  try {
    const response = await request.get<{ knowledgePoints?: Array<{ id: number; name: string }> }>('/knowledge-points')
    knowledgePoints.value = response.knowledgePoints || []
  } catch (error) { console.error('[创建作业] 获取知识点列表失败:', error) }
}

function isObjectiveQuestion(type: string): boolean { return ['choice', 'fill', 'judge'].includes(type) }
function disabledDate(date: Date): boolean { return date.getTime() < Date.now() - 24 * 60 * 60 * 1000 }
function addQuestion() { formData.questions.push({ questionType: '', questionContent: '', standardAnswer: '', score: 10, knowledgePointId: null }) }
function removeQuestion(index: number) { if (formData.questions.length > 1) formData.questions.splice(index, 1) }

function validateObjectiveAnswers(): boolean {
  for (let i = 0; i < formData.questions.length; i++) {
    const q = formData.questions[i]
    if (isObjectiveQuestion(q.questionType) && !q.standardAnswer.trim()) {
      ElMessage.error(`第 ${i + 1} 题是客观题，必须提供标准答案`)
      return false
    }
  }
  return true
}

async function handleSaveDraft() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    saving.value = true
    const data = { ...formData, deadline: formData.deadline?.toISOString(), status: 'draft' }
    await request.post('/assignments', data)
    ElMessage.success('草稿保存成功')
    router.push('/teacher/assignments')
  } catch (error: unknown) {
    if (error !== false) { console.error('[创建作业] 保存草稿失败:', error); const m = (error as { response?: { data?: { message?: string } } })?.response?.data?.message; ElMessage.error(m || '保存失败') }
  } finally { saving.value = false }
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (!validateObjectiveAnswers()) return
    saving.value = true
    const data = { ...formData, deadline: formData.deadline?.toISOString(), status: 'draft' }
    const response = await request.post<{ id?: number }>('/assignments', data)
    await request.post(`/assignments/${response.id}/publish`)
    ElMessage.success('作业创建并发布成功')
    router.push('/teacher/assignments')
  } catch (error: unknown) {
    if (error !== false) { console.error('[创建作业] 创建发布失败:', error); const m = (error as { response?: { data?: { message?: string } } })?.response?.data?.message; ElMessage.error(m || '创建失败') }
  } finally { saving.value = false }
}

function goBack() { router.back() }
onMounted(() => { fetchClasses(); fetchKnowledgePoints() })
</script>

<style scoped>
.assignment-create-page { min-height: 100%; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; color: #F0F0F0; }
.form-card { max-width: 900px; }
.assignment-form { padding: 20px 0; }
.questions-section { padding: 10px 0; }
.question-item { background: #2a2a2a; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
.question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.question-number { font-weight: bold; color: #00FF94; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; }
</style>
