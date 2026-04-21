import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { VChart } from './plugins/echarts'

createApp(App).use(router).use(ElementPlus).component('VChart', VChart).mount('#app')
