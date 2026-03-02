"""
NLP问答模块
实现问题意图识别、答案生成和解题步骤生成
"""

import re
from typing import Dict, List
from bert_grading import calculate_semantic_similarity


# 知识库：存储常见问题和答案
KNOWLEDGE_BASE = {
    "数学": {
        "勾股定理": {
            "answer": "勾股定理指出：在直角三角形中，两条直角边的平方和等于斜边的平方，即 a² + b² = c²",
            "steps": [
                "1. 确认三角形是直角三角形",
                "2. 识别两条直角边a和b",
                "3. 识别斜边c",
                "4. 应用公式 a² + b² = c²"
            ],
            "examples": [
                "例题：已知直角三角形两直角边为3和4，求斜边长度。解：c² = 3² + 4² = 9 + 16 = 25，所以c = 5"
            ]
        },
        "一元二次方程": {
            "answer": "一元二次方程的标准形式是 ax² + bx + c = 0，可以使用求根公式 x = (-b ± √(b²-4ac)) / 2a 求解",
            "steps": [
                "1. 将方程化为标准形式 ax² + bx + c = 0",
                "2. 确定系数a、b、c的值",
                "3. 计算判别式 Δ = b² - 4ac",
                "4. 应用求根公式求解"
            ],
            "examples": [
                "例题：解方程 x² - 5x + 6 = 0。解：a=1, b=-5, c=6，Δ=25-24=1，x = (5±1)/2，所以x₁=3, x₂=2"
            ]
        }
    },
    "物理": {
        "牛顿第一定律": {
            "answer": "牛顿第一定律（惯性定律）指出：任何物体在不受外力作用时，总保持静止状态或匀速直线运动状态",
            "steps": [
                "1. 理解惯性的概念",
                "2. 识别物体是否受外力",
                "3. 判断物体的运动状态",
                "4. 应用惯性定律分析"
            ],
            "examples": [
                "例题：汽车突然刹车时，乘客会向前倾。解释：乘客由于惯性保持原来的运动状态，而汽车减速，所以乘客相对汽车向前倾"
            ]
        },
        "光合作用": {
            "answer": "光合作用是植物利用光能，将二氧化碳和水转化为有机物（葡萄糖）并释放氧气的过程",
            "steps": [
                "1. 光反应：叶绿体吸收光能",
                "2. 水的光解：产生氧气和氢离子",
                "3. 暗反应：二氧化碳固定",
                "4. 合成有机物（葡萄糖）"
            ],
            "examples": [
                "例题：植物在光照下进行光合作用，吸收CO₂释放O₂，这个过程发生在叶绿体中"
            ]
        }
    },
    "化学": {
        "酸碱中和": {
            "answer": "酸碱中和反应是酸和碱反应生成盐和水的过程，通式为：酸 + 碱 → 盐 + 水",
            "steps": [
                "1. 识别反应物（酸和碱）",
                "2. 确定生成物（盐和水）",
                "3. 配平化学方程式",
                "4. 计算反应物用量"
            ],
            "examples": [
                "例题：HCl + NaOH → NaCl + H₂O，盐酸和氢氧化钠反应生成氯化钠和水"
            ]
        }
    }
}


def identify_question_intent(question: str) -> Dict:
    """
    识别问题意图
    
    Args:
        question: 用户问题
        
    Returns:
        意图识别结果
        {
            'intent': str,  # 问题类型：concept, solve, explain
            'subject': str,  # 学科
            'topic': str     # 主题
        }
    """
    # 简化实现：基于关键词识别
    intent = 'concept'  # 默认为概念解释
    subject = '通用'
    topic = ''
    
    # 识别学科
    if any(keyword in question for keyword in ['数学', '方程', '几何', '代数', '勾股']):
        subject = '数学'
    elif any(keyword in question for keyword in ['物理', '力', '运动', '能量', '牛顿']):
        subject = '物理'
    elif any(keyword in question for keyword in ['化学', '反应', '元素', '分子', '酸碱']):
        subject = '化学'
    
    # 识别意图
    if any(keyword in question for keyword in ['怎么解', '如何求', '计算', '求解']):
        intent = 'solve'
    elif any(keyword in question for keyword in ['为什么', '原因', '解释']):
        intent = 'explain'
    elif any(keyword in question for keyword in ['是什么', '什么是', '定义', '概念']):
        intent = 'concept'
    
    return {
        'intent': intent,
        'subject': subject,
        'topic': topic
    }


def search_knowledge_base(question: str, subject: str) -> Dict:
    """
    从知识库检索答案
    
    Args:
        question: 用户问题
        subject: 学科
        
    Returns:
        检索到的知识条目，如果未找到返回None
    """
    if subject not in KNOWLEDGE_BASE:
        return None
    
    # 计算问题与知识库中每个主题的相似度
    best_match = None
    best_similarity = 0.0
    
    for topic, content in KNOWLEDGE_BASE[subject].items():
        # 简化实现：检查关键词匹配
        if topic in question or any(keyword in question for keyword in topic.split()):
            similarity = 0.9
        else:
            # 使用语义相似度
            similarity = calculate_semantic_similarity(question, content['answer'])
        
        if similarity > best_similarity:
            best_similarity = similarity
            best_match = content
    
    # 如果相似度太低，返回None
    if best_similarity < 0.3:
        return None
    
    return best_match


def generate_answer(question: str, context: str = "") -> Dict:
    """
    生成问题答案
    
    Args:
        question: 用户问题
        context: 上下文信息（可选）
        
    Returns:
        答案字典
        {
            'answer': str,
            'steps': List[str],
            'related_examples': List[str]
        }
    """
    # 识别问题意图
    intent_info = identify_question_intent(question)
    
    # 从知识库检索答案
    knowledge = search_knowledge_base(question, intent_info['subject'])
    
    if knowledge:
        return {
            'answer': knowledge['answer'],
            'steps': knowledge['steps'],
            'related_examples': knowledge['examples']
        }
    else:
        # 如果知识库中没有，返回通用回答
        return {
            'answer': f"抱歉，我暂时无法回答关于'{question}'的问题。建议您查阅相关教材或咨询老师。",
            'steps': [
                "1. 查阅教材相关章节",
                "2. 搜索相关学习资源",
                "3. 向老师或同学请教"
            ],
            'related_examples': []
        }


def generate_solution_steps(problem: str, problem_type: str) -> List[str]:
    """
    生成解题步骤
    
    Args:
        problem: 题目内容
        problem_type: 题目类型
        
    Returns:
        解题步骤列表
    """
    # 根据题目类型生成通用解题步骤
    if problem_type == '数学':
        return [
            "1. 仔细阅读题目，理解题意",
            "2. 列出已知条件和未知量",
            "3. 选择合适的公式或方法",
            "4. 进行计算求解",
            "5. 检验答案是否合理"
        ]
    elif problem_type == '物理':
        return [
            "1. 分析物理过程",
            "2. 画出示意图",
            "3. 列出相关物理量",
            "4. 应用物理定律",
            "5. 求解并检验"
        ]
    elif problem_type == '化学':
        return [
            "1. 识别反应物和生成物",
            "2. 写出化学方程式",
            "3. 配平方程式",
            "4. 进行计算",
            "5. 检查结果"
        ]
    else:
        return [
            "1. 理解题目要求",
            "2. 分析问题",
            "3. 制定解决方案",
            "4. 实施方案",
            "5. 验证结果"
        ]


def answer_question(question: str, context: str = "") -> Dict:
    """
    回答学生问题（主接口）
    
    Args:
        question: 学生问题
        context: 上下文信息
        
    Returns:
        完整的答案信息
    """
    return generate_answer(question, context)
