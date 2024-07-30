//React Three Rapier is bugged when interacting between sensors and vehicles, this is a workaround.

import React from 'react';
import { Box } from '@react-three/drei';
import { forwardRef } from "react"

//sample usage 
//<CuboidTrigger position={[0, 0, 0]} size={[4, 5, 6]} />
const CuboidTrigger = forwardRef(({ position, size }, ref) => {
    const [width, height, depth] = size;
  
    return (
      <Box args={[width, height, depth]} position={position} ref={ref}>
        <meshStandardMaterial color="hotpink" wireframe />
      </Box>
    );
  });

export default CuboidTrigger;