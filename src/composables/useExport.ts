import { ElMessage } from 'element-plus'

export function useExport() {
  function doExport(url: string, filename: string, ids?: number[]) {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (ids && ids.length > 0) {
      params.set('ids', ids.join(','))
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL
    const fullUrl = `${baseUrl}${url}?${params.toString()}`

    const xhr = new XMLHttpRequest()
    xhr.open('GET', fullUrl)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'blob'

    xhr.onload = function () {
      if (xhr.status === 200) {
        const blob = xhr.response
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
        URL.revokeObjectURL(link.href)
      } else {
        ElMessage.error('导出失败')
      }
    }

    xhr.onerror = function () {
      ElMessage.error('导出失败')
    }

    xhr.send()
  }

  return { doExport }
}
