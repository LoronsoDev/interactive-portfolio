//REACT
import { useEffect, useRef } from "react"
import Room from './Room.jsx'
import RoomColliders from './RoomColliders.jsx'
import Car from "./Car.jsx";

//THREE / R3F
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber";
import { CuboidCollider, RigidBody} from "@react-three/rapier"
import { useHelper } from "@react-three/drei"

//DEBUG
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'

class CamSettings {
    constructor(pos = { x: -33, y: 3, z: 30 }, lookAt = { x: -24, y: 3, z: 32.3 }) {
      this.pos = pos;
      this.lookAt = lookAt;
    }
    copy = (camSettings) => {
        this.pos = camSettings.pos
        this.lookAt = camSettings.lookAt
    }
  }

export default function Experience()
{
    let pos = {x: -33, y: 3, z: 30}
    let lookAt = {x: -24, y: 3, z: 32.3}
    let currentCamSettings = new CamSettings(pos, lookAt)
    const firstCamSettings = new CamSettings(pos, lookAt)
    const secondCamSettings = new CamSettings({x:-33, y:3, z:-10}, {x:-24, y:3, z:-7})
    const thirdCamSettings = new CamSettings({x:-33, y:3, z:-70}, {x:-24, y:3, z:-65})
    const goindToBedCamSettings = new CamSettings({x:-33, y:40, z:-10}, {x:-24, y:30, z:-7})
    const aboveBedCamSettings = new CamSettings({x:10, y:25, z:65}, {x:70, y:10, z:-30})

    const carChassisRef = useRef()
    const pointLight = useRef()
    const dirLight = useRef()

    const controls = useControls({ position: firstCamSettings.pos, lookAt: firstCamSettings.lookAt, dirLightPos:{x: -33, y: 10, z: 1}})

    const lerpCamera = (originalCamSetting, destCamSetting) => {
        const x_pos = THREE.MathUtils.lerp(originalCamSetting.pos.x, destCamSetting.pos.x, 0.02)
        const y_pos = THREE.MathUtils.lerp(originalCamSetting.pos.y, destCamSetting.pos.y, 0.02)
        const z_pos = THREE.MathUtils.lerp(originalCamSetting.pos.z, destCamSetting.pos.z, 0.02)

        const x_look = THREE.MathUtils.lerp(originalCamSetting.lookAt.x, destCamSetting.lookAt.x, 0.02)
        const y_look = THREE.MathUtils.lerp(originalCamSetting.lookAt.y, destCamSetting.lookAt.y, 0.02)
        const z_look = THREE.MathUtils.lerp(originalCamSetting.lookAt.z, destCamSetting.lookAt.z, 0.02)

        currentCamSettings.pos = { x: x_pos, y: y_pos, z: z_pos }
        currentCamSettings.lookAt = { x: x_look, y: y_look, z: z_look }
    }

    const manageCameraStage = (camera, carPos) => {
        const camMovementMultiplier = 0.1
        if (carPos.z >= 24) 
        {
            lerpCamera(currentCamSettings, firstCamSettings)
        }
        if (carPos.z < 24) 
        {
            lerpCamera(currentCamSettings, secondCamSettings)
        }
        if (carPos.z < -18) 
        {
            lerpCamera(currentCamSettings, thirdCamSettings)
        }
        // if (carPos.y > 2)
        // {
        //     lerpCamera(currentCamSettings, goindToBedCamSettings)
        // }
        if (carPos.y > 6)
        {
            lerpCamera(currentCamSettings, aboveBedCamSettings)
        }
        console.log(carPos)
        const diff = {x: (carPos.x - currentCamSettings.lookAt.x ) * camMovementMultiplier, y: (carPos.y - currentCamSettings.lookAt.y) * camMovementMultiplier, z: (carPos.z - currentCamSettings.lookAt.z) * camMovementMultiplier}
        camera.position.set(currentCamSettings.pos.x, currentCamSettings.pos.y, currentCamSettings.pos.z) 
        camera.lookAt(currentCamSettings.lookAt.x + diff.x, currentCamSettings.lookAt.y, currentCamSettings.lookAt.z + diff.z)
      };

    useFrame((state, dt) => {
        // currentCamSettings.pos = controls.position
        // currentCamSettings.lookAt = controls.lookAt
        const pos = carChassisRef.current.translation()
        const camera = state.camera
        manageCameraStage(camera, pos)
        pointLight.current.position.set(pos.x, pos.y + 1, pos.z) 
        dirLight.current.position.set(controls.dirLightPos.x, controls.dirLightPos.y, controls.dirLightPos.z) 
    });

    // useHelper(light, THREE.DirectionalLightHelper, 1, "red");

    useThree((state) => {
        state.camera.position.set(controls.position.x, controls.position.y, controls.position.z)
        state.camera.lookAt(new THREE.Vector3(controls.lookAt.x, controls.lookAt.y, controls.lookAt.z))
        // state.camera?.lookAt(new THREE.Vector3(70, 900, -30))
        // state.camera.up = new THREE.Vector3(0, 1, 0);
        // state.camera.updateProjectionMatrix()
    });

    return <>
        <Perf position="top-left" />
        
        <directionalLight ref={dirLight} position={[-33,10,0]} castShadow shadow-normalBias={ 0.04 }/>
        <pointLight ref={pointLight} castShadow position={[-33,3,30]} intensity={1.5} shadow-normalBias={ 0.04 }/>
        <ambientLight intensity={ 1.75 } />
        
        <Room scale={15} position={ [0,17.5,0]}/>
        <RoomColliders scale={15} position={ [0,17.5,0]} visible={false}/>

        {/* <CuboidTrigger position={[controls.leftTriggerPos]} size={[4, 5, 6]} ref={camAreas[0]} /> */}

        <Car ref={carChassisRef}/>

        {/* aux floor */}
        {/* <RigidBody collider={false} type="fixed" position={[0, -2, 0]}>
            <CuboidCollider args={[100, 1, 100]}/>
        </RigidBody> */}
    </>
}