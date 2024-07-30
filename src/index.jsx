import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './Experience.jsx'
import Car from './Car.jsx'
import Room from './Room.jsx'

import { Physics } from "@react-three/rapier"
import { KeyboardControls } from '@react-three/drei'
import { StrictMode } from 'react'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <StrictMode>
        <KeyboardControls
            map={[
                {name: "forward", keys:["ArrowUp", "KeyW"]},
                {name: "back", keys:["ArrowDown", "KeyS"]},
                {name: "left", keys:["ArrowLeft", "KeyA"]},
                {name: "right", keys:["ArrowRight", "KeyD"]},
                {name: "brake", keys:["Space"]},
                {name: "turbo", keys:["Shift"]},
                {name: "reset", keys:["KeyR"]},
            ]
            }>
            <Canvas
                shadows
                camera={ {
                    fov: 45,
                    near: 0.1,
                    far: 200,
                    position: [ 4, 2, 6 ]
                } }
                dpr={[1,2]}
            >
                <Physics>
                <Experience />
                </Physics>
            </Canvas>
        </KeyboardControls>
    </StrictMode>
)