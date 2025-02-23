import { DynamicRayCastVehicleController } from '@dimforge/rapier3d-compat'
import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, Physics, RigidBody, RoundCylinderCollider, useAfterPhysicsStep, useRapier} from "@react-three/rapier"
import { useRef, useEffect, forwardRef } from "react"
import { BoxGeometry, MeshBasicMaterial, Vector3 } from "three"
import * as THREE from "three"
import { useMobileControls } from './MobileControls'

const Car = forwardRef((props, chassisRef) =>
{
    const defaultPosition = [-18, 3, 30]
    const defaultRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), // Y axis
        Math.PI * 0.5  // 90 degrees in radians
    )

    const { world, rapier } = useRapier()
    const vehicleController = useRef()
    
    const wheelRefs = [
        useRef(null),   //front right
        useRef(null),   //front left
        useRef(null),   //back  right
        useRef(null)    //back  left
    ]

    const [subscribeKeys, getKeys] = useKeyboardControls()
    
    const mobileControls = useMobileControls()
    
    useFrame((state, delta) =>
        {
            const keyboardControls = getKeys()
            
            // Combine keyboard and mobile controls
            const controls = {
                forward: keyboardControls.forward || mobileControls.forward,
                back: keyboardControls.back || mobileControls.back,
                left: keyboardControls.left || mobileControls.left,
                right: keyboardControls.right || mobileControls.right,
                turbo: keyboardControls.turbo || mobileControls.turbo,
                brake: keyboardControls.brake || mobileControls.brake,
                reset: keyboardControls.reset || mobileControls.reset
            }
            
            // Reduced acceleration and added sensitivity multiplier
            const acceleration = 6 // Reduced from 12
            const accelerationSensitivity = 0.7 // Added sensitivity multiplier
            let engineForce = ((controls.forward * acceleration) - (controls.back * acceleration)) * accelerationSensitivity
            
            const turboMultiplier = 2.5
            const brakePower = 0.1
            
            const vehController = vehicleController.current
            
            if(controls.reset)
            {
                vehController.chassis().setTranslation(new rapier.Vector3(defaultPosition[0], defaultPosition[1], defaultPosition[2]))
                vehController.chassis().setLinvel(new rapier.Vector3(0, 0, 0))
                vehController.chassis().setAngvel(new rapier.Vector3(0,0,0), true)
                vehController.chassis().setRotation(defaultRotation, true)
            }


            // orbitControls.current.target = new THREE.Vector3(vehController.chassis().translation().x, vehController.chassis().translation().y + 1, vehController.chassis().translation().z)
            // // orbitControls.current.minDistance = 10
            // orbitControls.current.maxDistance = 10
            // orbitControls.current.maxPolarAngle = 3.1415 / 2
            
            if (controls.turbo) engineForce *= turboMultiplier
            vehController.setWheelBrake(0, brakePower * controls.brake)
            vehController.setWheelBrake(1, brakePower * controls.brake)
            vehController.setWheelBrake(2, brakePower * controls.brake)
            vehController.setWheelBrake(3, brakePower * controls.brake)

            const maxSteerAngle = Math.PI/6
            let dir = mobileControls.left - mobileControls.right
            const currentSteering = vehController.wheelSteering(0) || 0

            const steering = THREE.MathUtils.lerp(currentSteering, maxSteerAngle * dir, 0.1)

            vehController.setWheelSteering(0, steering) 
            vehController.setWheelSteering(1, steering)

            vehController.setWheelEngineForce(2, (engineForce))
            vehController.setWheelEngineForce(3, (engineForce))
            }
            )
            
            
            const _wheelSteeringQuat = new THREE.Quaternion()
            const _wheelRotationQuat = new THREE.Quaternion()
            const up = new THREE.Vector3(0,1,0)
            
    useAfterPhysicsStep(() =>
    {
        if(!vehicleController.current) return
        
        const vehController = vehicleController.current

        vehController.updateVehicle(world.timestep)

        Object.keys(wheelRefs).forEach((key, index) => {
            const wheelAxleCs = vehController.wheelAxleCs(index) || 0
            const connection = vehController.wheelChassisConnectionPointCs(index) || 0
            const suspension = vehController.wheelSuspensionLength(index) || 0
            const steering = vehController.wheelSteering(index) || 0
            const rotationRad = vehController.wheelRotation(index) || 0
            
            const ref = wheelRefs[key].current

            // ref.position.x = connection.x
            ref.position.y = connection.y - suspension
            // ref.position.z = connection.z
            ref.rotation.y = rotationRad
            _wheelSteeringQuat.setFromAxisAngle(up, steering)
            _wheelRotationQuat.setFromAxisAngle(wheelAxleCs, rotationRad)
            
            // console.log(rotationRad)
            ref.quaternion.multiplyQuaternions(_wheelSteeringQuat, _wheelRotationQuat)
           
            // console.log(ref.quaternion)
        });
        
        // wheelRefs.fr.current.rotation.y = Math.PI * 2
        // wheelRefs.fr.current.rotation.z = rotationRad
    })

    const wheel_battle = 0.9
    const wheel_dist_to_chassis = 0.8
    const wheel_floor_to_chassis = 0.3
    const radius = 0.3
    const axleCs = { x: 0, y: 0, z: -1 }
    const wheelInfo = [
        // front
        {position: new THREE.Vector3(-wheel_dist_to_chassis, -wheel_floor_to_chassis, wheel_battle), radius: radius},
        {position: new THREE.Vector3(-wheel_dist_to_chassis, -wheel_floor_to_chassis, -wheel_battle), radius: radius},
        // rear
        {position: new THREE.Vector3(wheel_dist_to_chassis, -wheel_floor_to_chassis, wheel_battle), radius: radius},
        {position: new THREE.Vector3(wheel_dist_to_chassis, -wheel_floor_to_chassis, -wheel_battle), radius: radius},
    ]


    useEffect(() => {
        if (!chassisRef.current) return
        const vehicle = world.createVehicleController(chassisRef.current)
        const suspensionDirection = new THREE.Vector3(0, -1, 0)
        const suspensionStiffness = 35
        const suspensionMaxSuspensionTravel = 1

        wheelInfo.forEach((wheel, index) => {
            vehicle.addWheel(wheel.position, suspensionDirection, axleCs, 0.125, wheel.radius);
            vehicle.setWheelSuspensionStiffness(index, suspensionStiffness);
            vehicle.setWheelMaxSuspensionTravel(index, suspensionMaxSuspensionTravel)
        })
            
        
        vehicleController.current = vehicle
        console.log("Created vehicle:", vehicle)
        return () => {
            vehicleController.current = undefined
            world.removeVehicleController(vehicle)
        }
    }, [])

    const chassisSize = [1.5,0.4,0.8]
    return <>

            <RigidBody position={ [1,2,4]} rotation-z={Math.PI}>
                <mesh castShadow scale={ [1,1,2]}>
                    <boxGeometry castShadow receiveShadow/>
                    <meshStandardMaterial color="orange" />
                </mesh>
            </RigidBody>

            <RigidBody colliders={false} ref={chassisRef} position={defaultPosition} rotation={[0, Math.PI * 0.5, 0]} canSleep={false}>
                
                <CuboidCollider args={chassisSize} />
                
                <mesh castShadow scale={ [chassisSize[0] * 2,chassisSize[1] * 2,chassisSize[2] * 2] }>
                    <boxGeometry />
                    <meshStandardMaterial color="red" />
                </mesh>

                {wheelInfo.map((wheel, index) => (
                    <group key={index} position={[wheel.position.x, wheel.position.y, wheel.position.z]} ref={wheelRefs[index]} >
                        <group rotation-x={Math.PI*0.5}>
                            <mesh castShadow receiveShadow scale={ [1,1,1] } >
                                <cylinderGeometry args={[wheel.radius, wheel.radius, 0.3, 32]} />
                                <meshStandardMaterial color="black"/>
                            </mesh>
                        </group>
                    </group>
                ))}

            </RigidBody>
    </>

})

export default Car