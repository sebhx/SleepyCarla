<script setup lang="ts">
import SleepTracker from "./components/SleepTracker.vue";
</script>

<template>
  <div class="app">
    <SleepTracker />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #ffe5f1 0%, #e8f4fd 100%);
  min-height: 100vh;
  color: #444;
}

.app {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Baby-themed color palette */
:root {
  --baby-pink: #ffb6c1;
  --baby-blue: #87ceeb;
  --baby-yellow: #fffacd;
  --baby-orange: #ffa500;
  --baby-coral: #ff7f7f;
  --baby-lavender: #e6e6fa;
  --baby-mint: #f0ffff;
  --baby-purple: #dda0dd;
  --soft-white: #fff8f8;
  --text-dark: #444444;
  --text-light: #666666;
  --primary-color: #87ceeb;
  --shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.1);
  --background-light: #f8f9fa;
  --border-light: #e0e0e0;
}
</style>
