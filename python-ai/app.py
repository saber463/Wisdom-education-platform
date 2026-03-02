"""
智慧教育学习平台 - Python AI服务
提供OCR识别、BERT主观题评分、NLP问答、个性化推荐等AI功能
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import threading
from dotenv import load_dotenv

# 导入AI模块
from ocr import recognize_text
from bert_grading import grade_subjective_answer
from nlp_qa import answer_question
from recommendation import recommend_exercises

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'message': 'Python AI服务运行中'
    })


@app.route('/api/ocr/recognize', methods=['POST'])
def ocr_recognize():
    """OCR文字识别接口"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': '未提供图片文件'}), 400
        
        image_file = request.files['image']
        image_data = image_file.read()
        image_format = request.form.get('format', 'jpg')
        
        result = recognize_text(image_data, image_format)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/grading/subjective', methods=['POST'])
def grade_subjective():
    """主观题评分接口"""
    try:
        data = request.json
        result = grade_subjective_answer(
            data['question'],
            data['student_answer'],
            data['standard_answer'],
            data['max_score']
        )
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/qa/answer', methods=['POST'])
def qa_answer():
    """AI答疑接口"""
    try:
        data = request.json
        result = answer_question(
            data['question'],
            data.get('context', '')
        )
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommend/exercises', methods=['POST'])
def recommend():
    """个性化推荐接口"""
    try:
        data = request.json
        result = recommend_exercises(
            data['student_id'],
            data['weak_point_ids'],
            data.get('count', 10)
        )
        return jsonify({'exercises': result})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def start_grpc_server():
    """在后台线程启动gRPC服务器"""
    try:
        from grpc_server import serve
        serve()
    except Exception as e:
        print(f'gRPC服务器启动失败: {str(e)}')


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    
    # 在后台线程启动gRPC服务器
    grpc_thread = threading.Thread(target=start_grpc_server, daemon=True)
    grpc_thread.start()
    
    print(f'Python AI服务已启动，HTTP端口: {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
