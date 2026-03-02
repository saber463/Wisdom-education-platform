<template>
  <div class="teams-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>学习小组</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        创建小组
      </el-button>
    </div>

    <!-- 创建小组对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建学习小组" width="500px">
      <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="100px">
        <el-form-item label="小组名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入小组名称" />
        </el-form-item>
        <el-form-item label="学习目标" prop="goal">
          <el-input v-model="createForm.goal" type="textarea" rows="3" placeholder="请输入学习目标" />
        </el-form-item>
        <el-form-item label="成员上限" prop="memberLimit">
          <el-input-number v-model="createForm.memberLimit" :min="2" :max="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTeam">创建</el-button>
      </template>
    </el-dialog>

    <!-- 加入小组对话框 -->
    <el-dialog v-model="showJoinDialog" title="加入学习小组" width="500px">
      <el-form :model="joinForm" :rules="joinRules" ref="joinFormRef" label-width="100px">
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input v-model="joinForm.inviteCode" placeholder="请输入邀请码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" @click="handleJoinTeam">加入</el-button>
      </template>
    </el-dialog>

    <!-- 小组列表 -->
    <div class="teams-list">
      <el-empty v-if="teams.length === 0" description="暂无小组，创建或加入一个小组开始协作学习吧" />
      
      <div v-else class="teams-grid">
        <div v-for="team in teams" :key="team.team_id" class="team-card">
          <!-- 小组卡片头部 -->
          <div class="team-header">
            <div class="team-title">
              <h3>{{ team.name }}</h3>
              <el-tag v-if="team.is_creator" type="success" size="small">创建者</el-tag>
            </div>
            <el-dropdown @command="handleTeamCommand($event, team)">
              <el-button link type="primary">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view">查看详情</el-dropdown-item>
                  <el-dropdown-item command="share" v-if="team.is_creator">分享邀请码</el-dropdown-item>
                  <el-dropdown-item command="leave" v-if="!team.is_creator">退出小组</el-dropdown-item>
                  <el-dropdown-item command="delete" v-if="team.is_creator">解散小组</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 小组信息 -->
          <div class="team-info">
            <p class="goal">{{ team.goal }}</p>
            <div class="stats">
              <span class="stat">
                <el-icon><User /></el-icon>
                {{ team.current_members }}/{{ team.max_members }}人
              </span>
              <span class="stat">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(team.created_at) }}
              </span>
            </div>
          </div>

          <!-- 成员头像 -->
          <div class="members-preview">
            <el-avatar
              v-for="(member, index) in team.members.slice(0, 5)"
              :key="member.student_id"
              :src="member.avatar_url"
              :alt="member.real_name"
              size="small"
              :style="{ marginLeft: index > 0 ? '-8px' : '0' }"
            />
            <span v-if="team.members.length > 5" class="more-members">
              +{{ team.members.length - 5 }}
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="team-actions">
            <el-button type="primary" link @click="goToTeamDetail(team.team_id)">
              进入小组
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加入小组按钮 -->
    <div class="join-button-container">
      <el-button @click="showJoinDialog = true">
        <el-icon><Plus /></el-icon>
        加入小组
      </el-button>
    </div>

    <!-- 分享邀请码对话框 -->
    <el-dialog v-model="showShareDialog" title="分享邀请码" width="400px">
      <div class="share-content">
        <p>邀请码：</p>
        <div class="invite-code-display">
          <span class="code">{{ selectedTeam?.invite_code }}</span>
          <el-button type="primary" size="small" @click="copyInviteCode">复制</el-button>
        </div>
        <p class="tip">将邀请码分享给同学，他们可以使用邀请码加入小组</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, MoreFilled, User, Calendar } from '@element-plus/icons-vue'
import axios from 'axios'

interface Team {
  team_id: number
  name: string
  goal: string
  creator_id: number
  creator_name: string
  max_members: number
  current_members: number
  invite_code: string
  created_at: string
  members: any[]
  is_creator: boolean
  is_member: boolean
}

const router = useRouter()

// 状态
const teams = ref<Team[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showJoinDialog = ref(false)
const showShareDialog = ref(false)
const selectedTeam = ref<Team | null>(null)

// 创建小组表单
const createForm = ref({
  name: '',
  goal: '',
  memberLimit: 10
})

const createRules = {
  name: [
    { required: true, message: '请输入小组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '小组名称长度在2-50个字符', trigger: 'blur' }
  ],
  goal: [
    { required: true, message: '请输入学习目标', trigger: 'blur' },
    { min: 5, max: 200, message: '学习目标长度在5-200个字符', trigger: 'blur' }
  ]
}

const createFormRef = ref()

// 加入小组表单
const joinForm = ref({
  inviteCode: ''
})

const joinRules = {
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { len: 6, message: '邀请码长度为6个字符', trigger: 'blur' }
  ]
}

const joinFormRef = ref()

// 获取小组列表
const fetchTeams = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/teams/my-teams')
    if (response.data.success) {
      teams.value = response.data.data
    }
  } catch (error) {
    console.error('获取小组列表失败:', error)
    ElMessage.error('获取小组列表失败')
  } finally {
    loading.value = false
  }
}

// 创建小组
const handleCreateTeam = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    
    const response = await axios.post('/api/teams', {
      name: createForm.value.name,
      learning_goal: createForm.value.goal,
      member_limit: createForm.value.memberLimit
    })

    if (response.data.success) {
      ElMessage.success('小组创建成功')
      showCreateDialog.value = false
      createForm.value = { name: '', goal: '', memberLimit: 10 }
      await fetchTeams()
    }
  } catch (error) {
    console.error('创建小组失败:', error)
    ElMessage.error('创建小组失败')
  }
}

// 加入小组
const handleJoinTeam = async () => {
  if (!joinFormRef.value) return
  
  try {
    await joinFormRef.value.validate()
    
    // 需要先获取小组ID，这里假设通过邀请码查询
    const response = await axios.post('/api/teams/join-by-code', {
      invite_code: joinForm.value.inviteCode
    })

    if (response.data.success) {
      ElMessage.success('加入小组成功')
      showJoinDialog.value = false
      joinForm.value = { inviteCode: '' }
      await fetchTeams()
    }
  } catch (error) {
    console.error('加入小组失败:', error)
    ElMessage.error('加入小组失败')
  }
}

// 小组操作命令
const handleTeamCommand = (command: string, team: Team) => {
  selectedTeam.value = team
  
  switch (command) {
    case 'view':
      goToTeamDetail(team.team_id)
      break
    case 'share':
      showShareDialog.value = true
      break
    case 'leave':
      handleLeaveTeam(team)
      break
    case 'delete':
      handleDeleteTeam(team)
      break
  }
}

// 进入小组详情
const goToTeamDetail = (teamId: number) => {
  router.push(`/student/teams/${teamId}`)
}

// 退出小组
const handleLeaveTeam = (team: Team) => {
  ElMessageBox.confirm(
    `确定要退出小组"${team.name}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/teams/${team.team_id}/leave`)
      if (response.data.success) {
        ElMessage.success('已退出小组')
        await fetchTeams()
      }
    } catch (error) {
      console.error('退出小组失败:', error)
      ElMessage.error('退出小组失败')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 解散小组
const handleDeleteTeam = (team: Team) => {
  ElMessageBox.confirm(
    `确定要解散小组"${team.name}"吗？所有学习记录和互评数据将被保留。`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/teams/${team.team_id}`)
      if (response.data.success) {
        ElMessage.success('小组已解散')
        await fetchTeams()
      }
    } catch (error) {
      console.error('解散小组失败:', error)
      ElMessage.error('解散小组失败')
    }
  }).catch(() => {
    // 用户取消
  })
}

// 复制邀请码
const copyInviteCode = () => {
  if (selectedTeam.value?.invite_code) {
    navigator.clipboard.writeText(selectedTeam.value.invite_code)
    ElMessage.success('邀请码已复制')
  }
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 页面加载
onMounted(() => {
  fetchTeams()
})
</script>

<style scoped lang="scss">
.teams-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
}

.teams-list {
  margin-bottom: 30px;
}

.teams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.team-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: white;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #409eff;
  }
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;

  .team-title {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }
}

.team-info {
  flex: 1;
  margin-bottom: 15px;

  .goal {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .stats {
    display: flex;
    gap: 15px;
    font-size: 12px;
    color: #999;

    .stat {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }
}

.members-preview {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 5px;

  .more-members {
    font-size: 12px;
    color: #999;
    margin-left: 5px;
  }
}

.team-actions {
  display: flex;
  gap: 10px;
}

.join-button-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.share-content {
  padding: 20px;

  p {
    margin: 0 0 10px 0;
    color: #333;
  }

  .invite-code-display {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 15px;

    .code {
      flex: 1;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
      color: #409eff;
      text-align: center;
    }
  }

  .tip {
    font-size: 12px;
    color: #999;
    margin: 0;
  }
}
</style>
