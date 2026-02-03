class Physics {
  /**
   * @param {Object} params - Configuration object
   * @param {number} params.M - Vehicle mass (kg)
   * @param {number} params.Cd - Aerodynamic drag coefficient
   * @param {number} params.A - Frontal area (m^2)
   * @param {number} params.rho - Air density 20°C
   * @param {number} params.Croll - Rolling resistance coefficient
   * @param {number} params.g - Gravity
   * @param {number} params.theta - Slope angle in degrees
   */
  constructor({
    M = 1741,
    Cd = 0.36,
    A = 2.42,
    rho = 1.225,
    Croll = 0.015,
    g = 9.81,
    theta = 0.0
  } = {}) {
    this.M = M;
    this.Cd = Cd;
    this.A = A;
    this.rho = rho;
    this.Croll = Croll;
    this.g = g;
    // Convert deg -> rad manually (JS doesn't have np.radians)
    this.theta = theta * (Math.PI / 180);
  }

  // ======== Forces ========
  
  aerodynamicDrag(v) {
    return 0.5 * this.rho * this.Cd * this.A * Math.pow(v, 2);
  }

  rollingResistance() {
    return this.Croll * this.M * this.g * Math.cos(this.theta);
  }

  gravitationalForce() {
    return this.M * this.g * Math.sin(this.theta);
  }

  // ======== Integration Step ========
  
  /**
   * @param {number} v - current velocity
   * @param {number} u - accelerator command (-1 to 1)
   * @param {number} dt - delta time
   */
  step(v, u, dt) {
    // F_t = traction force = u * F_max
    const Fmax = 6000; // approximated max traction
    
    // np.clip replacement: Math.max(min, Math.min(max, val))
    const uClamped = Math.max(-1, Math.min(1, u));
    const Ft = uClamped * Fmax;

    const Fa = this.aerodynamicDrag(v);
    const Frr = this.rollingResistance();
    const Fg = this.gravitationalForce();

    // Total opposing forces
    const FResist = Fa + Frr + Fg;

    // dv/dt = (Ft – F_resist) / M
    const dv = (Ft - FResist) / this.M;

    // Velocity integration
    let vNew = v + dv * dt;
    vNew = Math.max(vNew, 0); // no backward movement

    // Return object equivalent to Python tuple
    return {
      vNew: vNew,
      dv: dv,
      Ft: Ft
    };
  }
}
