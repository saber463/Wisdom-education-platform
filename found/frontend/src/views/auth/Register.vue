<template>
  <div class="register-container">
    <ProgrammingBackground />
    <DynamicLanguages
      :languages="programmingLanguages"
      :direction="'left'"
      :show-emojis="true"
      :speed="100"
    />
    <RegisterForm />
  </div>
</template>

<script setup>
import ProgrammingBackground from '@/components/auth/ProgrammingBackground.vue';
import DynamicLanguages from '@/components/common/DynamicLanguages.vue';
import RegisterForm from '@/components/auth/RegisterForm.vue';

const programmingLanguages = [
  { text: 'Python', color: '#3776AB' },
  { text: 'JavaScript', color: '#F7DF1E' },
  { text: 'Java', color: '#007396' },
  { text: 'C++', color: '#00599C' },
  { text: 'C#', color: '#239120' },
  { text: 'HTML', color: '#E34F26' },
  { text: 'CSS', color: '#1572B6' },
  { text: 'React', color: '#61DAFB' },
  { text: 'Vue', color: '#4FC08D' },
  { text: 'Angular', color: '#DD0031' },
  { text: 'Node.js', color: '#339933' },
  { text: 'SQL', color: '#4479A1' },
  { text: 'PHP', color: '#777BB4' },
  { text: 'Ruby', color: '#CC342D' },
  { text: 'Go', color: '#00ADD8' },
  { text: 'Swift', color: '#FA7343' },
  { text: 'Kotlin', color: '#0095D5' },
  { text: 'TypeScript', color: '#3178C6' },
  { text: 'Rust', color: '#DEA584' },
  { text: 'Dart', color: '#0175C2' },
  { text: 'Perl', color: '#0298C3' },
  { text: 'Shell', color: '#89E051' },
  { text: 'Matlab', color: '#0076A8' },
  { text: 'R', color: '#276DC3' },
  { text: 'Scala', color: '#DC322F' },
];
</script>

<style scoped>
.register-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Arial', sans-serif;
}
</style>
