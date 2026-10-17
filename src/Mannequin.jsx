import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Mannequin({ gender='men', garment='hoodie', color='#a4d65e' }) {
  const mount = useRef(null);
  const settings = useRef({ gender, garment, color });
  settings.current = { gender, garment, color };
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#151813');
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
    camera.position.set(0, 1.8, 7.8);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xe5f0d8, 0x25291f, 2.1));
    const key = new THREE.DirectionalLight(0xffffff, 3.0); key.position.set(3,5,5); key.castShadow=true; scene.add(key);
    const rim = new THREE.DirectionalLight(0x9dc65d, 1.7); rim.position.set(-4,2,-3); scene.add(rim);
    const group = new THREE.Group(); scene.add(group);
    const matSkin = new THREE.MeshStandardMaterial({color:'#8f8a7e', roughness:.82, metalness:.02});
    const matCloth = new THREE.MeshStandardMaterial({color:settings.current.color, roughness:.78});
    const matDark = new THREE.MeshStandardMaterial({color:'#272b24', roughness:.9});
    const sphere = (x,y,z,sx,sy,sz,mat=matSkin) => { const m=new THREE.Mesh(new THREE.SphereGeometry(1,32,24),mat); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=true; group.add(m); return m; };
    const cyl = (x,y,z,rt,rb,h,mat=matSkin,seg=24) => { const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat); m.position.set(x,y,z); m.castShadow=true; group.add(m); return m; };
    const limb = (a,b,r1,r2,mat=matSkin) => {
      const v1=new THREE.Vector3(...a), v2=new THREE.Vector3(...b), d=v2.clone().sub(v1);
      const m=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,d.length(),20),mat);
      m.position.copy(v1.clone().add(v2).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); m.castShadow=true; group.add(m);
      sphere(...a,r1,r1,r1,mat); sphere(...b,r2,r2,r2,mat);
    };
    // Full human-shaped, deliberately faceless mannequin — no eyes, mouth or nose.
    const female = settings.current.gender === 'women';
    sphere(0,2.48,0,.31,.39,.27);
    // Smooth blank face plate gives a deliberately faceless head.
    sphere(0,2.50,.225,.235,.285,.075,matSkin);
    cyl(0,2.02,0,.095,.11,.25,matSkin);
    sphere(0,1.60,0,female?.43:.48,.56,.25,matSkin);
    sphere(0,1.66,.015,female?.37:.43,.44,.27,matCloth);
    // Torso/garment silhouette: shoulders and chest are human-shaped, not a cube.
    sphere(0,1.86,0,female?.48:.54,.31,.28,matCloth);
    sphere(0,1.48,0,female?.37:.43,.27,.245,matCloth);
    // Sleeves and arms, bent slightly away from the body.
    limb([-.48,1.91,0],[-.67,1.48,.015],.16,.115,matCloth);
    limb([-.67,1.48,.015],[-.72,1.04,.07],.11,.075,matSkin);
    limb([.48,1.91,0],[.67,1.48,.015],.16,.115,matCloth);
    limb([.67,1.48,.015],[.72,1.04,.07],.11,.075,matSkin);
    // Hips and separate legs.
    sphere(0,1.08,0,female?.39:.42,.23,.23,matDark);
    limb([-.21,.98,0],[-.24,.43,0],.19,.14,matDark);
    limb([-.24,.43,0],[-.25,-.19,.03],.135,.105,matDark);
    limb([.21,.98,0],[.24,.43,0],.19,.14,matDark);
    limb([.24,.43,0],[.25,-.19,.03],.135,.105,matDark);
    sphere(-.25,-.23,.12,.15,.09,.28,matDark); sphere(.25,-.23,.12,.15,.09,.28,matDark);
    // Hood or collar, subtly raised behind the blank head.
    if (settings.current.garment === 'hoodie') {
      const hood = new THREE.Mesh(new THREE.TorusGeometry(.27,.075,12,32,Math.PI),matCloth);
      hood.position.set(0,2.47,-.11); hood.rotation.z=Math.PI; group.add(hood);
      cyl(0,1.45,.245,.012,.012,.3,matDark);
    } else if (settings.current.garment === 'tee') {
      sphere(0,2.05,.015,.17,.12,.12,matCloth);
    } else {
      sphere(0,1.85,0,.54,.33,.3,matCloth);
    }
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.2,64),new THREE.MeshStandardMaterial({color:'#20241d',roughness:1}));
    floor.rotation.x=-Math.PI/2; floor.position.y=-.34; floor.receiveShadow=true; scene.add(floor);
    const grid = new THREE.GridHelper(5,20,'#454d3a','#292e25'); grid.position.y=-.335; scene.add(grid);
    const resize=()=>{const w=host.clientWidth||500,h=host.clientHeight||540; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();};
    resize(); const ro=new ResizeObserver(resize); ro.observe(host);
    let frame; const animate=()=>{frame=requestAnimationFrame(animate); group.rotation.y=Math.sin(Date.now()*.00045)*.14; renderer.render(scene,camera);}; animate();
    return ()=>{cancelAnimationFrame(frame);ro.disconnect();renderer.dispose();host.removeChild(renderer.domElement);};
  }, [gender, garment, color]);
  return <div className="mannequin" ref={mount} aria-label={`Faceless ${gender} 3D mannequin wearing ${garment}`} />;
}
