<template>
  <div>
    <h1>Juxtapose: <br />
      Compare Audio</h1>

    <div :class="{'card': true,
                  'controls-card': true,
                  'tracks-card': !playback_state.looping}">
      <h3>Controls</h3>
      <div class="control-set">
        <div class="controls">
          <span class="tooltip">
            <img
            @click="go_to_start"
            src="@/assets/lt.png"
            class="control-icon">
            <span class="noselect">Go to start (z)</span>
          </span>
          <span class="tooltip">
            <img :src="PlayPauseImgs[playpause_img]" class="control-icon" @click="toggle_playback()">
            <span class="noselect">
              {{ playback_state.playing ? "Pause (x)" : "Play (x)" }}
            </span>
          </span>
          <!-- <span class="tooltip">
            <img
            @click="go_to_end"
            src="@/assets/ff.png"
            class="control-icon">
            <span class="noselect">Go to end</span>
          </span> -->
          <span class="tooltip">
            <img
            @click="toggle_loop()"
            src="@/assets/repeat.png"
            :class="{'control-icon': true,
                     'control-active': !playback_state.looping}" />
            <span class="noselect">Toggle loop (c)</span>
          </span>
        </div>
      </div>

      <div class="loop-range-container-top">
        <div class="loop-range-container"
        :style="{ display: playback_state.looping ? 'inherit' : 'none' }">
          <v-range-slider
          :style="{width: '100%'}"
          :min="0"
          :max="SEEK_PRECISION"
          :thumb-size="12"
          :ripple="false"
          v-model="loop_range"
          ></v-range-slider>
        </div>
        <div v-if="playback_state.looping"
        style="margin-bottom: 1em;">
          {{
            loop_range.map(
              v => format_time(
                Math.round(
                  Math.max(
                    ...tracks.map(t => t.audio.duration)
                  ) * v/SEEK_PRECISION
                )
              )
            ).join(' - ')
          }}
        </div>
      </div>

    </div>

    <div class="card" v-for="(track, index) in tracks">
      <trackCard :title="track.title"
      :track_index="index"
      :track_length="track.audio.duration"
      :track_active="active_track_index == index"
      :track_width="scale_duration(track.audio.duration)"
      @track_change="change_track(index)"
      @seek_mouse_event="seek_mouse_action"
      @request_seek="change_seek"
      @remove_track="remove_track"
      @swap_cards="swap_cards"
      :num_tracks="tracks.length"
      ref="track_cards" />
    </div>

    <div class="card tracks-card">
      <h3>Add Tracks</h3>
      <div class="input-file">
        <input
        type="file"
        accept=".wav,.mp3"
        ref="track_adder"
        @change="track_selected()"
        multiple
        />
        <div class="file-adder-hint noselect"><span>Or drag and drop files here</span></div>
      </div>
      <div class="input-filename">
        Title: <input type="text"
                      ref="track_title"
                      @keypress.enter="load_track" />
      </div>
      <div>
        <button @click="load_track">Add</button>
        <!-- <button @click="export_config">Export</button> -->
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { filename } from 'pathe/utils'
import { reactive, ref, onMounted } from 'vue'
import { SEEK_PRECISION, format_time } from '../App.vue'

import trackCard from '../components/trackCard.vue'

onMounted(() => {
  document.onkeydown = ((e: KeyboardEvent) => {
    if (e.target == document.body) {
      switch (e.key.toLocaleLowerCase()) {
        case "z": {
          go_to_start()
          break
        }
        case "x": {
          toggle_playback()
          break
        }
        case "c": {
          toggle_loop()
          break
        }
        case "j": {
          change_track((active_track_index.value + 1) % tracks.length)
          break
        }
        case "k": {
          change_track((active_track_index.value + tracks.length - 1) % tracks.length)
          break
        }
        case "d": {
          remove_track(active_track_index.value)
          break
        }
        case "?": {
          emit("flash_error", "z-Goto start  x-Play/Pause  c-Toogle loop  j-Next track  k-Previous Track  d-Remove track")
          break
        }
      }
    }
  })
})

const loop_range = ref<[number, number]>([0, SEEK_PRECISION])

const emit = defineEmits(["flash_error"])

type GlobType = { [fname: string]: {default: string} }
const glob: GlobType = import.meta.glob('@/assets/play-pause/*.png', { eager: true })
const PlayPauseImgs = Object.fromEntries(
  Object.entries(glob).map(([k, v]) => [filename(k), v.default])
)

const PAUSE_IMG_NAME = "pause"
const PLAY_IMG_NAME = "play"

const playpause_img = ref(PLAY_IMG_NAME)

type TrackCards = InstanceType<typeof trackCard>[]
const track_cards = ref<TrackCards | null>(null)

const playback_state = reactive({
  playing: false,
  looping: false
})

function toggle_loop() {
  if (!tracks.length) {
    return
  }
  playback_state.looping = !playback_state.looping
}

function go_to_start() {
  let seek_target = 0
  if (playback_state.looping) {
    seek_target = loop_range.value[0]
  }
  (track_cards.value as TrackCards).forEach((card) => {
    card.update_seek_pos(seek_target)
  })
  tracks.forEach((track) => {
    const seek_time = Math.min(
      track.audio.duration,
      max_track_duration * seek_target / SEEK_PRECISION
    )
    console.log(seek_time)
    track.audio.currentTime = seek_time
  })
}

const active_track_index = ref<number>(0)
const tracks = reactive<{
  audio: HTMLAudioElement,
  title: string,
}[]>([])
let max_track_duration = 0

// function export_config() {
//   console.log(track_adder.value &&
//               track_adder.value.files,
//               track_adder.value &&
//               track_adder.value.files &&
//               track_adder.value.files.length)
// }

function swap_cards(from: number, to: number) {
  tracks.splice(to, 0, ...tracks.splice(from, 1))
  if (active_track_index.value == from) {
    active_track_index.value = to
  } else if (active_track_index.value == to) {
    active_track_index.value = from
  }
  (track_cards.value as TrackCards).forEach((card, indx) => {
    card.update_seek_pos(scale_seek(indx, tracks[active_track_index.value].audio.currentTime))
  })
}

function remove_track(track_index: number) {
  if (tracks.length == 1) {
    tracks[0].audio.pause()
    tracks.splice(track_index, 1)
    playback_state.playing = false
    playback_state.looping = false
    playpause_img.value = PLAY_IMG_NAME
    max_track_duration = 0
    return
  }
  const removed = tracks.splice(track_index, 1)[0]
  if (active_track_index.value > track_index)  {
    active_track_index.value = active_track_index.value - 1;
  } else if (active_track_index.value == tracks.length) {
    active_track_index.value = tracks.length - 1
  }
  removed.audio.pause()
  change_seek(removed.audio.currentTime)
  if (playback_state.playing) {
    tracks[active_track_index.value].audio.play()
  }
  max_track_duration = Math.max(...tracks.map(t => t.audio.duration))
}

function scale_duration(duration: number) {
  return duration/max_track_duration * 100
}

let seek_mouse_down = false
function seek_mouse_action(down: boolean) {
  seek_mouse_down = down
}

function change_seek(seek_to: number) {
  tracks[active_track_index.value].audio.currentTime = seek_to
}

function change_track(new_track_index: number) {
  tracks[active_track_index.value].audio.pause()
  tracks[new_track_index].audio.currentTime = Math.min(
    tracks[active_track_index.value].audio.currentTime,
    tracks[new_track_index].audio.duration
  )
  if (playback_state.playing) {
    tracks[new_track_index].audio.play()
  }
  active_track_index.value = new_track_index
}

function toggle_playback() {
  if (!tracks.length) {
    return
  }

  const active_track = tracks[active_track_index.value].audio
  if (playback_state.playing) {
    active_track.pause()
  } else {
    active_track.play()
  }
  playback_state.playing = !playback_state.playing
}

const track_adder = ref<HTMLInputElement | null>(null)
const track_title = ref<HTMLInputElement | null>(null)

function track_selected() {
  if (!track_adder.value || !track_adder.value.files || track_adder.value.files.length == 0) {
    emit("flash_error", "Select file(s) to compare")
    return
  }
  const fnames = track_adder.value.files
  if (fnames.length == 1) {
    track_title.value!.value = fnames[0].name.replace(/\.[^/.]+$/, "")
    track_title.value!.focus()
    return
  }
  Array.from({ length: fnames.length }, (_, i) => i).forEach((indx: number) => {
    add_track(fnames[indx], fnames[indx].name.replace(/\.[^/.]+$/, ""))
  })

  track_adder.value!.value = ""
  track_title.value!.value = ""

  track_adder.value.focus()
  track_adder.value.blur()
}

function load_track() {
  const fname = track_adder.value?.files
  if (!fname?.length) {
    emit("flash_error", "Select a wav or mp3 file to compare")
    return
  }
  const title = track_title.value?.value
  if (!title) {
    emit("flash_error", "Title can not be empty")
    track_title.value!.focus()
    return
  }

  add_track(fname[0], title)

  track_adder.value!.value = ""
  track_title.value!.value = ""
}

function add_track(fname: File, title: string) {
  const a = new Audio(URL.createObjectURL(fname))

  a.onplay = () => {
    console.log("play")
    playpause_img.value = PAUSE_IMG_NAME
    playback_state.playing = true
  }
  a.onpause = () => {
    console.log("pause")
    playpause_img.value = PLAY_IMG_NAME
    playback_state.playing = false
  }

  a.onloadeddata = (() => {
    tracks.push({ audio: a, title: title })
    max_track_duration = Math.max(max_track_duration, a.duration)
  })
  a.onended = (() => {
    if (playback_state.looping && a.duration > loop_range.value[0] * max_track_duration / SEEK_PRECISION) {
      a.currentTime = loop_range.value[0] * max_track_duration / SEEK_PRECISION
      a.play()
      return
    }
    playback_state.playing = false
    playpause_img.value = PLAY_IMG_NAME
  })
  a.ontimeupdate = (() => {
    if (seek_mouse_down) {
      return
    }
    if (playback_state.looping) {
      if (a.currentTime >= loop_range.value[1] * max_track_duration / SEEK_PRECISION) {
        a.currentTime = loop_range.value[0] * max_track_duration / SEEK_PRECISION
        a.play()
        playback_state.playing = true
        playpause_img.value = PAUSE_IMG_NAME
      }
    }
    (track_cards.value as TrackCards).forEach((card, indx) => {
      card.update_seek_pos(scale_seek(indx, a.currentTime))
    })
  })
}

function scale_seek(track_index: number, seek_pos: number) {
  return (Math.min(seek_pos, tracks[track_index].audio.duration) /
          tracks[track_index].audio.duration * SEEK_PRECISION)
}
</script>

<style scoped>
h3 {
  margin: 0;
  font-size: 1.6em;
  line-height: 2em;
}
.controls {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  width: 320px;
}
.control-set {
  display: flex;
  justify-content: center;
}
.controls-card {
  display: flex;
  flex-direction: column;
}
.loop-range-container {
  padding: 0.5em 1em;
}
.loop-range-container-top {
  padding: 0.5em 1em;
}
.tracks-card {
  width: 40%;
  min-width: 320px;
  max-width: 640px;
  margin-top: 2.5em;
  padding: 0em 1em;
}
.input-filename { margin: 1em; }
.input-filename > input {
  margin-left: 1em;
  border: 1px solid #0000;
  border-bottom: 2px solid black;
}
.input-filename > input:hover {
  cursor: pointer;
}
.input-filename > input:focus {
  border: 1px solid #0000;
  border-bottom: 2px solid #0000;
}

input[type=file] {
  background-color: pink;
}

.input-file {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.input-file input {
  background: rgba(241, 241, 241, 0.75);
  outline: 2px dashed var(--color-1);
  outline-offset: -5px;
  padding: 3em 3em;
  width: 100%;
  margin: 0 auto;
  z-index: 2;
}
.input-file input:-moz-drag-over,
.input-file input:hover {
  background: #ddd8;
}
.input-file::before {
  position: absolute;
  bottom: 1em;
  content: "";
}
.file-adder-hint {
  z-index: 1;
  font-weight: 900;
  transform: translateY(-2em);
}

</style>
