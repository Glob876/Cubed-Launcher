// Millida's GPL grant excludes the brand backgrounds/cape. Do not ship those
// unused public assets in Cubed builds. The logo and app icons are replaced.
import { readdir, rm } from 'node:fs/promises'
await rm('dist/bg', {recursive:true,force:true})
await rm('dist/capes/millida.png', {force:true})
for (const name of await readdir('dist')) {
  if (/^hero-.*\.(png|jpe?g|webp|mp4)$/i.test(name)) await rm('dist/'+name)
}
