<script setup>
defineProps({ activeView: { type: String, required: true } });
defineEmits(['navigate']);
const items = [
  { key: 'overview', label: 'Overview', symbol: '◫' },
  { key: 'patients', label: 'Patients', symbol: '◎' },
  { key: 'appointments', label: 'Appointments', symbol: '▦' },
  { key: 'visits', label: 'Visits', symbol: '＋' },
  { key: 'documents', label: 'Documents', symbol: '▤' },
  { key: 'settings', label: 'AI Settings', symbol: '⚙' }
];
</script>
<template>
  <nav aria-label="Main navigation">
    <button v-for="item in items" :key="item.key" class="nav-item" :class="{ active: activeView === item.key }" :data-view="item.key" @click="$emit('navigate', item.key)">
      <span class="nav-symbol">{{ item.symbol }}</span><span>{{ item.label }}</span>
    </button>
  </nav>
</template>
