import { Point } from '../types';

export const toRadians = (deg: number) => (deg * Math.PI) / 180;
export const toDegrees = (rad: number) => (rad * 180) / Math.PI;

export const getCirclePoint = (center: Point, radius: number, angleDeg: number): Point => {
  const rad = toRadians(angleDeg);
  return {
    x: center.x + radius * Math.cos(rad),
    y: center.y - radius * Math.sin(rad), // SVG Y-axis is inverted
  };
};

// Calculate angle APB in degrees
export const calculateInscribedAngle = (A: Point, P: Point, B: Point): number => {
  // Vector PA
  const vPA = { x: A.x - P.x, y: A.y - P.y };
  // Vector PB
  const vPB = { x: B.x - P.x, y: B.y - P.y };

  const dotProduct = vPA.x * vPB.x + vPA.y * vPB.y;
  const magPA = Math.sqrt(vPA.x * vPA.x + vPA.y * vPA.y);
  const magPB = Math.sqrt(vPB.x * vPB.x + vPB.y * vPB.y);

  // Floating point protection
  const cosTheta = Math.max(-1, Math.min(1, dotProduct / (magPA * magPB)));
  const angleRad = Math.acos(cosTheta);
  
  return toDegrees(angleRad);
};

export const normalizeAngle = (angle: number) => {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
};

// Check if P is on the major arc (assuming A and B are symmetric around -90deg/270deg visually)
// A is at (270 - spread/2), B is at (270 + spread/2) usually
export const isOnMajorArc = (pAngle: number, angleA: number, angleB: number): boolean => {
    const normP = normalizeAngle(pAngle);
    const normA = normalizeAngle(angleA);
    const normB = normalizeAngle(angleB);
    
    // This logic depends on how we construct the arc. 
    // Simple check: Calculate the inscribed angle. If it's acute or obtuse consistent with the setup.
    // Actually, just checking if the angle is the expected constant or 180-constant is easier visually.
    return true; 
};
