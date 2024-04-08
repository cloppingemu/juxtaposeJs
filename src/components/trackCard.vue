<template>
  <div id="top" @mouseup="top_mouseup" @mouseleave="top_mouseleave">
    <div class="card-header">
      <span class="tooltip">
        <img
        src="../assets/listen.png"
        :class="{'control-icon': true,
                 'control-active': !track_active}"
        @click="select_track">
        <span class="noselect">Listen</span>
      </span>
      <h3> {{ title }} </h3>
      <span class="spacer"></span>
      <span class="controls">
        <span
        class="tooltip"
        :style="{
          visibility: track_index != 0 ? 'visible' : 'hidden'
        }">
          <img
          src="../assets/arrow_up.png"
          :class="{'control-icon': true}"
          @click="swap_cards(track_index, track_index - 1)">
          <span class="noselect">Move up</span>
        </span>
        <span
        class="tooltip"
        :style="{
          visibility: track_index != num_tracks - 1 ? 'visible' : 'hidden'
        }">
          <img
          src="../assets/arrow_down.png"
          :class="{'control-icon': true}"
          @click="swap_cards(track_index, track_index + 1)">
          <span class="noselect">Move down</span>
        </span>
        <span class="tooltip">
          <img
          src="../assets/cross.png"
          :class="{'control-icon': true}"
          @click="remove_track">
          <span class="noselect">Remove</span>
        </span>
      </span>
    </div>

    <div class="seek">
      <v-slider
      v-model="seek_pos"
      :min="0"
      :max="SEEK_PRECISION"
      @mousedown="seek_md"
      @mouseup="seek_up"
      ref="seekbar"
      :thumb-size="12"
      :disabled="!track_active"
      :style="{width: track_width + `%`}">
      </v-slider>
      <span>
        {{ format_time(Math.round(seek_pos * track_length/SEEK_PRECISION)) }} /
        {{ format_time(Math.round(track_length)) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SEEK_PRECISION, format_time } from '../App.vue'

import { ref } from 'vue'
import { VSlider } from 'vuetify/components';

const seekbar = ref<VSlider | null>(null)
const seek_pos = ref<number>(0)

const emit = defineEmits([
  'track_change',
  'seek_mouse_event',
  'request_seek',
  'remove_track',
  'swap_cards'
])

const props = defineProps<{
  title: string,
  track_index: number,
  track_length: number,
  track_active: boolean,
  track_width: number,
  num_tracks: number
}>()


function swap_cards(from: number, to: number) {
  emit("swap_cards", from, to)
}


function select_track() {
  if (!props.track_active) {
    emit('track_change')
  }
}

function update_seek_pos(new_seek_pos: number) {
  seek_pos.value = new_seek_pos
}
defineExpose({update_seek_pos})

function remove_track() {
  // console.log("remove track")
  emit("remove_track", props.track_index)
}

let is_seeking = false;
function seek_md() {
  // console.log("seek mouse out")
  is_seeking = true
  emit('seek_mouse_event', true)
}
function seek_up() {
  if (is_seeking) {
    // console.log("seek mouse up")
    is_seeking = false
    emit('seek_mouse_event', false)
    const seek_to = (
      ((seekbar.value as VSlider).modelValue as number) *
      props.track_length / SEEK_PRECISION
    )
    emit('request_seek', seek_to)
  }
}

function top_mouseup() {
  if (is_seeking) {
    // console.log("top mouseup")
    is_seeking = false
    emit('seek_mouse_event', false)
    const seek_to = (
      ((seekbar.value as VSlider).modelValue as number) *
      props.track_length / SEEK_PRECISION
    )
    emit('request_seek', seek_to)
  }
}

function top_mouseleave() {
  if (is_seeking) {
    // console.log("top mouseleave")
    is_seeking = false
    emit('seek_mouse_event', false)
  }
}

</script>

<style scoped>
.controls > .tooltip {
  padding: 0 0.5em;
}

#top {
  padding: 0.5em 1em;
}
.card-header {
  display: flex;
  flex-direction: row;
}

.seek {
  padding: 0.5em 1em;
  display: flex;
  flex-direction: column;
}
h3 {
  display: inline;
  margin: 0;
  font-size: 1.6em;
  line-height: 2em;
  margin-left: 0.5em
}
.spacer {
  flex-grow: 1;
}

</style>
