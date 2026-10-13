import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Upload, RotateCcw } from 'lucide-react'

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'
const WASM_URLS = ['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm', 'https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm']

function roundedBox(w, h, d, radius = 0.08) {
  // Beveled-looking, softly rounded form built from a scaled sphere-like mesh.
  const geometry = new THREE.BoxGeometry(w, h, d, 8, 8, 8)
  const p = geometry.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const cx = Math.max(-w / 2 + radius, Math.min(w / 2 - radius, x))
    const cy = Math.max(-h / 2 + radius, Math.min(h / 2 - radius, y))
    const cz = Math.max(-d / 2 + radius, Math.min(d / 2 - radius, z))
    const dx = x - cx, dy = y - cy, dz = z - cz
    const len = Math.hypot(dx, dy, dz)
    if (len > 0) { p.setXYZ(i, cx + dx / len * radius, cy + dy / len * radius, cz + dz / len * radius) }
  }
  geometry.computeVertexNormals()
  return geometry
}

export default function ThreeFitRoom({ product, onAdd }) {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const [faceStatus, setFaceStatus] = useState('Upload a face photo — full body photo is not required.')
  const [busy, setBusy] = useState(false)
  const [height, setHeight] = useState(70)
  const [build, setBuild] = useState('FIT')
  const initialGarment = product.category === 'HOODIES' ? 'HOODIES' : product.category === 'BOTTOMS' || product.category === 'SHORTS' ? 'SHORTS' : 'TEES'
  const [garment, setGarment] = useState(initialGarment)
  const [faceTexture, setFaceTexture] = useState(null)

  useEffect(() => { setGarment(product.category === 'HOODIES' ? 'HOODIES' : product.category === 'BOTTOMS' || product.category === 'SHORTS' ? 'SHORTS' : 'TEES') }, [product])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#d9dfd0')
    scene.fog = new THREE.Fog('#d9dfd0', 8, 17)
    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 2.75, 8.6)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true; controls.target.set(0, 2.35, 0); controls.minDistance = 5; controls.maxDistance = 12
    scene.add(new THREE.HemisphereLight('#f6f2df', '#52604c', 2.1))
    const key = new THREE.DirectionalLight('#fff2d0', 3.0); key.position.set(-3, 7, 5); key.castShadow = true; scene.add(key)
    const rim = new THREE.DirectionalLight('#9fbd76', 2.2); rim.position.set(4, 4, -4); scene.add(rim)
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.5, 64), new THREE.MeshStandardMaterial({ color: '#c2ccb9', roughness: 1 }))
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; floor.receiveShadow = true; scene.add(floor)
    const grid = new THREE.GridHelper(8, 24, '#9daa91', '#c2ccb9'); grid.position.y = 0.025; scene.add(grid)
    const avatar = new THREE.Group(); scene.add(avatar)
    const skin = new THREE.MeshStandardMaterial({ color: '#bd8e70', roughness: .82 })
    const darkSkin = new THREE.MeshStandardMaterial({ color: '#a8765c', roughness: .9 })
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#252722', roughness: .92 })
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#343831', roughness: .9 })
    const seamMat = new THREE.MeshStandardMaterial({ color: '#89966d', roughness: .8 })
    const makeMesh = (geo, mat, pos, scale) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); if(scale)m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; avatar.add(m); return m }
    // 5'10" avatar scaled to a 1.78 m design baseline; proportions are a visual default, not a body measurement.
    makeMesh(new THREE.SphereGeometry(.205, 24, 18), skin, [0, 3.13, 0], [1, 1.22, .92]) // head
    makeMesh(new THREE.CylinderGeometry(.105, .12, .22, 20), skin, [0, 2.88, 0]) // neck
    const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(.29, .34), new THREE.MeshBasicMaterial({ color: '#b98b70', transparent: true, side: THREE.DoubleSide, depthWrite: false }))
    facePlane.position.set(0, 3.14, .202); avatar.add(facePlane)
    // torso / waist
    makeMesh(roundedBox(.73, .88, .38, .11), shirtMat, [0, 2.32, 0], [build === 'ATHLETIC' ? 1.08 : 1, 1, 1])
    makeMesh(new THREE.CylinderGeometry(.24, .27, .25, 24), pantsMat, [0, 1.75, 0])
    // shoulders and arms
    makeMesh(new THREE.SphereGeometry(.17, 20, 16), shirtMat, [-.43, 2.62, 0], [1.25, .95, 1])
    makeMesh(new THREE.SphereGeometry(.17, 20, 16), shirtMat, [.43, 2.62, 0], [1.25, .95, 1])
    makeMesh(new THREE.CapsuleGeometry(.095, .55, 5, 12), shirtMat, [-.51, 2.17, 0], [1, 1, 1]).rotation.z = -.07
    makeMesh(new THREE.CapsuleGeometry(.095, .55, 5, 12), shirtMat, [.51, 2.17, 0], [1, 1, 1]).rotation.z = .07
    makeMesh(new THREE.SphereGeometry(.105, 16, 12), skin, [-.53, 1.78, 0])
    makeMesh(new THREE.SphereGeometry(.105, 16, 12), skin, [.53, 1.78, 0])
    // legs
    makeMesh(new THREE.CapsuleGeometry(.13, .73, 5, 14), pantsMat, [-.16, 1.05, 0], [1, 1, 1])
    makeMesh(new THREE.CapsuleGeometry(.13, .73, 5, 14), pantsMat, [.16, 1.05, 0], [1, 1, 1])
    makeMesh(roundedBox(.19, .11, .36, .04), darkSkin, [-.16, .48, .08])
    makeMesh(roundedBox(.19, .11, .36, .04), darkSkin, [.16, .48, .08])
    // garment layer: independent, opaque 3D volume fitted around torso/legs, not a flat image overlay.
    const garmentGroup = new THREE.Group(); avatar.add(garmentGroup)
    const cloth = new THREE.MeshStandardMaterial({ color: product.category === 'HOODIES' ? '#282b27' : product.category === 'SHORTS' ? '#20231f' : '#343630', roughness: .98, metalness: 0 })
    const graphicMat = new THREE.MeshStandardMaterial({ color: '#a9c879', roughness: .75 })
    const rebuildGarment = () => {
      while (garmentGroup.children.length) { const o = garmentGroup.children.pop(); o.geometry?.dispose(); if (Array.isArray(o.material)) o.material.forEach(m=>m.dispose()); else o.material?.dispose() }
      const torso = new THREE.Mesh(roundedBox(.81, .92, .44, .12), cloth); torso.position.set(0, 2.32, .015); torso.castShadow = true; garmentGroup.add(torso)
      if (garment === 'SHORTS') {
        torso.scale.set(1.01, .48, 1.04); torso.position.y = 1.76
        for (const x of [-.17, .17]) { const leg = new THREE.Mesh(roundedBox(.29, .40, .43, .06), cloth); leg.position.set(x, 1.48, .02); garmentGroup.add(leg) }
      } else {
        for (const x of [-.47, .47]) { const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(.13, .43, 5, 12), cloth); sleeve.position.set(x, 2.43, .01); sleeve.rotation.z = x < 0 ? -.15 : .15; garmentGroup.add(sleeve) }
        if (garment === 'HOODIES') { const hood = new THREE.Mesh(new THREE.TorusGeometry(.16, .075, 10, 24, Math.PI), cloth); hood.position.set(0, 2.86, -.09); hood.rotation.z = Math.PI; garmentGroup.add(hood) }
        const emblem = new THREE.Mesh(roundedBox(.23, .12, .012, .025), graphicMat); emblem.position.set(-.15, 2.47, .242); garmentGroup.add(emblem)
        // Gharial-inspired spine marks on the back/side as a small raised detail.
        for (let i=0;i<7;i++){const scale = new THREE.Mesh(new THREE.SphereGeometry(.022, 8, 6), graphicMat); scale.position.set(.0, 2.65-i*.075, -.225); garmentGroup.add(scale)}
      }
    }
    rebuildGarment()
    const photoTextureMaterial = facePlane.material
    if (faceTexture) { photoTextureMaterial.map = faceTexture; photoTextureMaterial.color.set('#ffffff'); photoTextureMaterial.needsUpdate = true }
    else { photoTextureMaterial.map = null; photoTextureMaterial.color.set('#bd8e70'); photoTextureMaterial.needsUpdate = true }
    // scale avatar to the selected height; baseline 5'10".
    avatar.scale.setScalar(height / 70)
    sceneRef.current = { scene, camera, renderer, controls, avatar, garmentGroup, rebuildGarment }
    let raf
    const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera) }
    animate()
    const resize = () => { if (!mountRef.current) return; camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight) }
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); controls.dispose(); renderer.dispose(); mount.replaceChildren(); scene.traverse(o=>{o.geometry?.dispose(); if(o.material){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material.dispose()}}); sceneRef.current = null }
  }, [faceTexture, height, build, garment, product])

  async function handlePhoto(file) {
    if (!file || !file.type.startsWith('image/')) return
    setBusy(true)
    setFaceStatus('Opening photo and detecting face…')
    let bitmap
    try {
      bitmap = await createImageBitmap(file)
      let box = null
      let detectorError = null
      // Try both public WASM CDNs. A model/network failure should not make the upload silently do nothing.
      try {
        const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
        for (const wasmUrl of WASM_URLS) {
          let detector
          try {
            const vision = await FilesetResolver.forVisionTasks(wasmUrl)
            detector = await FaceDetector.createFromOptions(vision, {
              baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
              runningMode: 'IMAGE',
              minDetectionConfidence: 0.25,
            })
            const result = detector.detect(bitmap)
            const d = result.detections?.sort((a, b) => (b.categories?.[0]?.score || 0) - (a.categories?.[0]?.score || 0))[0]
            if (d?.boundingBox) { box = d.boundingBox; break }
          } catch (err) { detectorError = err }
          finally { detector?.close?.() }
        }
      } catch (err) { detectorError = err }

      let sx, sy, sw, sh
      if (box) {
        // Pad the face crop to include hairline, chin and a little side profile.
        const padX = box.width * 0.32
        const padY = box.height * 0.34
        sx = Math.max(0, box.originX - padX)
        sy = Math.max(0, box.originY - padY)
        sw = Math.min(bitmap.width - sx, box.width + padX * 2)
        sh = Math.min(bitmap.height - sy, box.height + padY * 2)
      } else {
        // Usable fallback: a front-facing face selfie is normally centered. The UI is honest that this was not auto-detected.
        const side = Math.min(bitmap.width, bitmap.height) * 0.62
        sx = Math.max(0, Math.min(bitmap.width - side, (bitmap.width - side) / 2))
        sy = Math.max(0, Math.min(bitmap.height - side, (bitmap.height - side) / 2 - side * 0.06))
        sw = Math.min(side, bitmap.width - sx)
        sh = Math.min(side, bitmap.height - sy)
      }

      const canvas = document.createElement('canvas')
      canvas.width = 360; canvas.height = 420
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas is unavailable in this browser.')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Crop to a portrait and mask the corners so the photo blends into the 3D head rather than appearing as a square sticker.
      const cropAspect = sw / sh
      let drawW = 360, drawH = 420
      if (cropAspect > drawW / drawH) drawW = drawH * cropAspect
      else drawH = drawW / cropAspect
      ctx.save()
      ctx.beginPath(); ctx.ellipse(180, 210, 174, 205, 0, 0, Math.PI * 2); ctx.clip()
      ctx.fillStyle = '#bd8e70'; ctx.fillRect(0, 0, 360, 420)
      ctx.drawImage(bitmap, sx, sy, sw, sh, (360 - drawW) / 2, (420 - drawH) / 2, drawW, drawH)
      ctx.restore()
      // Feathered oval edge reduces the rectangular-photo effect on the avatar.
      ctx.save(); ctx.globalCompositeOperation = 'destination-in'; ctx.beginPath(); ctx.ellipse(180, 210, 174, 205, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      const tex = new THREE.CanvasTexture(canvas)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.needsUpdate = true
      setFaceTexture(old => { old?.dispose?.(); return tex })
      if (box) setFaceStatus('Face detected ✓ Applied to your 5′10″ avatar. Drag the stage to rotate. For best results use a clear, front-facing photo.')
      else setFaceStatus('Photo applied using a centered crop. Automatic face detection could not lock on this image' + (detectorError ? ' — check internet/model access and try a clear, front-facing selfie.' : '; try a brighter, front-facing selfie for detection.') )
    } catch (err) {
      console.error('GAVIALIS face upload:', err)
      setFaceStatus(`Could not process this image: ${err?.message || 'unknown error'}. Try a JPG or PNG selfie.`)
    } finally {
      bitmap?.close?.()
      setBusy(false)
    }
  }

  return <div className="true-fit-lab">
    <div className="true-fit-stage"><div className="fit-stage-label"><span>GAVIALIS / 3D FIT LAB</span><span>DRAG TO ROTATE · SCROLL TO ZOOM</span></div><div className="three-mount" ref={mountRef}/><div className="avatar-badge"><span>DEFAULT AVATAR</span><strong>{Math.floor(height / 12)}′{Math.round(height % 12)}″ / {build}</strong></div></div>
    <div className="true-fit-controls">
      <label className="face-upload"><Upload size={16}/><span>{busy ? 'DETECTING FACE…' : 'UPLOAD FACE PHOTO'}</span><input type="file" accept="image/*" disabled={busy} onChange={e=>{ const file=e.target.files?.[0]; if(file) handlePhoto(file); e.target.value='' }}/></label>
      <p className="face-status">{faceStatus}</p>
      <label>HEIGHT <strong>{Math.floor(height / 12)}′{Math.round(height % 12)}″</strong><input type="range" min="58" max="78" step="1" value={height} onChange={e=>setHeight(Number(e.target.value))}/></label>
      <label>BODY BUILD <strong>{build}</strong><select value={build} onChange={e=>setBuild(e.target.value)}><option value="FIT">Fit / athletic</option><option value="SLIM">Slim</option><option value="ATHLETIC">Broad / athletic</option></select></label>
      <label>GARMENT <strong>{garment}</strong><select value={garment} onChange={e=>setGarment(e.target.value)}><option value="HOODIES">Hoodie</option><option value="TEES">T-shirt</option><option value="SHORTS">Shorts</option></select></label>
      <button className="fit-reset" onClick={()=>{setHeight(70);setBuild('FIT');setGarment(product.category === 'HOODIES' ? 'HOODIES' : product.category === 'BOTTOMS' || product.category === 'SHORTS' ? 'SHORTS' : 'TEES');setFaceTexture(null);setFaceStatus('Upload a face photo — full body photo is not required.')}}><RotateCcw size={14}/> RESET AVATAR</button>
      <p className="fit-note">Your photo is processed in your browser. The avatar and clothing are procedural 3D previews; they are not a body scan or a size/fit guarantee.</p>
      <button className="drawer-cta" onClick={onAdd}>ADD THIS PIECE TO BAG</button>
    </div>
  </div>
}
