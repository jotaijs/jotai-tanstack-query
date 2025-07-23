import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const ele = document.getElementById('app')
if (ele) {
  createRoot(ele).render(React.createElement(App))
}
