<template>
  <v-app>
    <v-main>
      <MainBody @flash_error="handle_error" />
      <div class="diversions"><a href="https://github.com/cloppingemu/juxtaposeJs" target="_blank">@Github</a></div>
      <b><div class="flash-error" ref="error_bar">
      </div></b>
    </v-main>
  </v-app>
</template>

<script lang="ts">
export const SEEK_PRECISION = 100_000

export function format_time(seconds: number) {
  return `${Math.floor(seconds/60)}`.padStart(2, '0') + ':' + `${seconds%60}`.padStart(2, '0')
}
</script>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MainBody from '@/views/MainBody.vue'

const error_bar = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (error_bar.value == null) {
    return
  }
  error_bar.value.style.bottom = `-${error_bar.value.scrollHeight}px`
})

function handle_error(message: string, timeout: number) {
  error_bar.value!.innerHTML = message
  error_bar.value!.style.bottom = '0px'
  setTimeout(() => {
    error_bar.value!.style.bottom = `-${error_bar.value!.scrollHeight}px`
  }, timeout)
}

</script>

<style>
.control-icon {
  width: 2.5em;
  border: 1px solid black;
  border-radius: 10px;
  padding: 0.5em;
  cursor: pointer;
}
.control-icon:hover {
  background-color: #ddd;
  opacity: 75%;
}
.control-active {
  background-color: #bbb;
  opacity: 50%;
}

.tooltip { outline: none; }
.tooltip span {
  z-index: 10;
  display: none;
  padding: 0.25em 1em;
  margin-top: 45px;
  width: 8em; margin-left: -5em;
}
.tooltip:hover span {
  display: inline;
  position: absolute;
  border: 2px solid #FFF;  color: #EEE;
  background: #333;
}
.tooltip span {
  border-radius:2px;
  box-shadow: 0px 0px 8px 4px #666;
  opacity: 0.5;
}

.white-text {
  color: white;
}

.flash-error {
  position: fixed;
  left: 0;
  width: 100%;
  background-color: red;
  color: white;
  text-align: center;
  padding: 1em;
  z-index: 10;
  transition: bottom 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.diversions {
  margin-top: 5em;
  font-weight: bold;
}
.diversions > a {
  text-decoration: none;
  color: var(--color-1);
}
.diversions > a:hover {
  color: #3fb27f;
}

.daftTable {
  width: 100%;
}
</style>
