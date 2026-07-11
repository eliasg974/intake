<script setup>
import { ref } from 'vue'
import { useIntake } from './composables/useIntake'
import DateNav from './components/DateNav.vue'
import GaugeCard from './components/GaugeCard.vue'
import StreakBar from './components/StreakBar.vue'
import WeekView from './components/WeekView.vue'
import TargetsEditor from './components/TargetsEditor.vue'
import QuickAdd from './components/QuickAdd.vue'
import ManualAdd from './components/ManualAdd.vue'
import LogList from './components/LogList.vue'
import DataTools from './components/DataTools.vue'
import SyncSettings from './components/SyncSettings.vue'

const { totals, targets } = useIntake()

const editingTargets = ref(false)
const showWeek = ref(true)
</script>

<template>
  <DateNav />

  <div class="gauges">
    <GaugeCard
      label="Protein" unit="g" mode="build" hero
      :value="totals.protein" :target="targets.protein"
    />
    <GaugeCard
      label="Energy" unit="kcal" mode="budget"
      :value="totals.kcal" :target="targets.kcal"
    />
  </div>

  <StreakBar />

  <div class="seclabel">
    <span>Last 7 days</span>
    <button @click="showWeek = !showWeek">{{ showWeek ? 'Hide' : 'Show' }}</button>
  </div>
  <WeekView v-if="showWeek" />

  <div class="seclabel">
    <span>Targets</span>
    <button @click="editingTargets = !editingTargets">
      {{ editingTargets ? 'Done' : 'Edit targets' }}
    </button>
  </div>
  <TargetsEditor v-if="editingTargets" />

  <QuickAdd />
  <ManualAdd />
  <LogList />
  <DataTools />
  <SyncSettings />
</template>

<style scoped>
.gauges {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}
</style>
