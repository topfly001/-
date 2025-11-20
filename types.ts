export interface Point {
  x: number;
  y: number;
}

export interface PolarPoint {
  r: number;
  theta: number; // radians
}

export enum AnimationState {
  PAUSED,
  PLAYING
}

export interface GeometryState {
  radius: number;
  chordSpread: number; // The angle spread between A and B from the center (in degrees)
  pAngle: number; // The angle of point P (in degrees)
}
