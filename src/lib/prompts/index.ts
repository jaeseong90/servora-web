import fs from 'fs'
import path from 'path'

export function loadPrompt(name: string): string {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'prompts', name)
  return fs.readFileSync(filePath, 'utf-8')
}
