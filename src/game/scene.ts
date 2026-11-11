/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BallState, TrajectoryPrediction, CueItem, TableSkin, PlayerGroup } from './types';
import { 
  TABLE_WIDTH, 
  TABLE_LENGTH, 
  BALL_RADIUS, 
  POCKETS 
} from './physics';
import { 
  getBallTexture, 
  getFeltTexture, 
  getWoodTexture, 
  getCueWrapTexture, 
  getBallMarkerTexture, 
  MarkerOwnerType 
} from './textures';

// Module-scope reusable math vectors to eliminate GC in render loop
const _vec3 = new THREE.Vector3();
const _euler = new THREE.Euler();
const _quat = new THREE.Quaternion();

export type CameraViewMode = 'aim' | 'top' | 'free';

export class PoolScene {
  private container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;

  public isSoftwareGl: boolean = false;
  private animFrameId: number = 0;
  private isDisposed: boolean = false;

  // Ball differentiation markers
  private markersGroup!: THREE.Group;
  private ballMarkerItems: Map<number, { group: THREE.Group; ringMesh: THREE.Mesh; sprite: THREE.Sprite; currentType: MarkerOwnerType }> = new Map();
  public showBallMarkers: boolean = true;
  private markerAnimTime: number = 0;

  // Ball-in-Hand Raycasting & Placement Visuals
  private tablePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -BALL_RADIUS);
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();
  private ballInHandGroup!: THREE.Group;

  // 3D Objects
  private tableGroup!: THREE.Group;
  private feltMesh!: THREE.Mesh;
  private woodRailMeshes: THREE.Mesh[] = [];
  private cushionMeshes: THREE.Mesh[] = [];
  private cushionMaterial!: THREE.MeshStandardMaterial;
  private ballMeshes: Map<number, THREE.Mesh> = new Map();
  private cueGroup!: THREE.Group;
  private cuePitch!: THREE.Group;
  private cueMeshParts: THREE.Mesh[] = [];
  private shadowPlane!: THREE.Mesh;

  // Trajectory Visuals
  private trajectoryGroup!: THREE.Group;
  private aimLineMesh!: THREE.Line;
  private targetLineMesh!: THREE.Line;
  private cueDeflectLineMesh!: THREE.Line;
  private ghostCueMesh!: THREE.Mesh;

  // Lights
  private keyLight!: THREE.DirectionalLight;
  private fillLight!: THREE.HemisphereLight;

  // Camera Control & Damping
  public viewMode: CameraViewMode = 'top';
  public zoomHeight: number = 1.95;
  public isPortrait: boolean = false;
  private targetUp = new THREE.Vector3(0, 0, -1);
  private curUp = new THREE.Vector3(0, 0, -1);
  private targetCamPos = new THREE.Vector3();
  private targetCamLookAt = new THREE.Vector3();
  private curCamLookAt = new THREE.Vector3();
  public orbitAngleX: number = 0;
  public orbitAngleY: number = 0.8;
  public orbitDistance: number = 2.2;

  // Aiming visual states
  private currentAimAngle: number = 0;
  private currentPower: number = 0;
  private isAiming: boolean = true;
  private isShooting: boolean = false;
  private strikeProgress: number = 0; // 0 to 1

  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  private init() {
    // 1. Detect software WebGL guard
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Setup Three.js Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const initW = this.container.clientWidth || window.innerWidth || 1280;
    const initH = this.container.clientHeight || window.innerHeight || 720;
    this.renderer.setSize(initW, initH);
    this.container.appendChild(this.renderer.domElement);

    // 3. Setup Scene & RoomEnvironment Reflection
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#090d18');
    this.scene.fog = new THREE.FogExp2('#090d18', 0.12);

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Setup Camera with orientation adaptation
    this.isPortrait = initH > initW;

    this.camera = new THREE.PerspectiveCamera(
      45,
      initW / initH,
      0.05,
      25
    );

    if (this.isPortrait) {
      this.targetUp.set(0, 0, -1);
      this.curUp.set(0, 0, -1);
      this.camera.up.set(0, 0, -1);
      this.camera.position.set(0, 3.2, 0.001);
    } else {
      this.targetUp.set(-1, 0, 0);
      this.curUp.set(-1, 0, 0);
      this.camera.up.set(-1, 0, 0);
      this.camera.position.set(0, 2.2, 0.001);
    }
    this.curCamLookAt.set(0, 0, 0);

    // 5. Lighting Rig
    this.setupLighting();

    // 6. Build Composite 3D Billiard Table, Cue, and Visuals
    this.buildPoolTable();
    this.buildCueStick();
    this.buildTrajectoryVisuals();
    this.buildBallMarkers();
    this.buildBallInHandVisual();

    // 7. Handle Window Resize & Orientation Change
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);

    // 8. Initial Render
    this.render();
  }

  private setupLighting() {
    // Warm key light casting shadows directly over table
    this.keyLight = new THREE.DirectionalLight('#fffbeb', 1.8);
    this.keyLight.position.set(0.5, 3.2, 0.4);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 6;
    this.keyLight.shadow.camera.left = -1.2;
    this.keyLight.shadow.camera.right = 1.2;
    this.keyLight.shadow.camera.top = 1.8;
    this.keyLight.shadow.camera.bottom = -1.8;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Cool sky/ground ambient fill
    this.fillLight = new THREE.HemisphereLight('#60a5fa', '#0f172a', 0.85);
    this.scene.add(this.fillLight);

    // Spot lamps hanging over table for atmospheric pool hall cone of light
    const spot1 = new THREE.SpotLight('#fef3c7', 2.2, 5, Math.PI / 4, 0.35, 1.5);
    spot1.position.set(0, 2.1, -0.45);
    spot1.target.position.set(0, 0, -0.45);
    this.scene.add(spot1);
    this.scene.add(spot1.target);

    const spot2 = new THREE.SpotLight('#fef3c7', 2.2, 5, Math.PI / 4, 0.35, 1.5);
    spot2.position.set(0, 2.1, 0.45);
    spot2.target.position.set(0, 0, 0.45);
    this.scene.add(spot2);
    this.scene.add(spot2.target);
  }

  // Build high-detail 3-12 part procedural billiard table
  private buildPoolTable() {
    this.tableGroup = new THREE.Group();
    this.scene.add(this.tableGroup);

    // 1. Bed / Slate with Felt (Loads the user-uploaded 8BP table cloth texture)
    const defaultTableTexture = '/assets/aistudio/897605018_1801695377894810_7053844980198404968_n_0e54bafe.jpg';
    const feltTex = getFeltTexture('#026ee6', 4, defaultTableTexture, () => {
      this.render();
    });
    const feltMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: feltTex,
      roughness: 0.8,
      metalness: 0.04,
    });
    const feltGeo = new THREE.BoxGeometry(TABLE_WIDTH, 0.04, TABLE_LENGTH);
    this.feltMesh = new THREE.Mesh(feltGeo, feltMat);
    this.feltMesh.position.y = -0.02;
    this.feltMesh.receiveShadow = true;
    this.tableGroup.add(this.feltMesh);

    // 2. Polished Warm Mahogany Wood Rails & Aprons
    const woodTex = getWoodTexture('#7a3311');
    const woodMat = new THREE.MeshStandardMaterial({
      color: '#7a3311',
      map: woodTex,
      roughness: 0.28,
      metalness: 0.15,
    });

    const railThickness = 0.09;
    const railHeight = 0.055;

    // Top & Bottom rails
    const topBottomRailGeo = new THREE.BoxGeometry(TABLE_WIDTH + railThickness * 2, railHeight, railThickness);
    const topRail = new THREE.Mesh(topBottomRailGeo, woodMat);
    topRail.position.set(0, railHeight / 2 - 0.015, -TABLE_LENGTH / 2 - railThickness / 2);
    topRail.castShadow = true;
    topRail.receiveShadow = true;
    this.tableGroup.add(topRail);
    this.woodRailMeshes.push(topRail);

    const botRail = new THREE.Mesh(topBottomRailGeo, woodMat);
    botRail.position.set(0, railHeight / 2 - 0.015, TABLE_LENGTH / 2 + railThickness / 2);
    botRail.castShadow = true;
    botRail.receiveShadow = true;
    this.tableGroup.add(botRail);
    this.woodRailMeshes.push(botRail);

    // Side rails (Left & Right)
    const sideRailGeo = new THREE.BoxGeometry(railThickness, railHeight, TABLE_LENGTH);
    const leftRail = new THREE.Mesh(sideRailGeo, woodMat);
    leftRail.position.set(-TABLE_WIDTH / 2 - railThickness / 2, railHeight / 2 - 0.015, 0);
    leftRail.castShadow = true;
    leftRail.receiveShadow = true;
    this.tableGroup.add(leftRail);
    this.woodRailMeshes.push(leftRail);

    const rightRail = new THREE.Mesh(sideRailGeo, woodMat);
    rightRail.position.set(TABLE_WIDTH / 2 + railThickness / 2, railHeight / 2 - 0.015, 0);
    rightRail.castShadow = true;
    rightRail.receiveShadow = true;
    this.tableGroup.add(rightRail);
    this.woodRailMeshes.push(rightRail);

    // 3. Rubber Cushion Bumpers (Matching royal blue cushions)
    this.cushionMaterial = new THREE.MeshStandardMaterial({
      color: '#0058b8',
      roughness: 0.88,
      metalness: 0.0,
    });
    const cushionMat = this.cushionMaterial;
    const cushionWidth = 0.025;
    const cushionHeight = 0.024;

    // Inner top & bottom cushions (tuned for wide, open 8 Ball Pool pocket mouths)
    const topCushionGeo = new THREE.BoxGeometry(TABLE_WIDTH - 0.155, cushionHeight, cushionWidth);
    const topCushion = new THREE.Mesh(topCushionGeo, cushionMat);
    topCushion.position.set(0, cushionHeight / 2, -TABLE_LENGTH / 2 + cushionWidth / 2);
    this.tableGroup.add(topCushion);
    this.cushionMeshes.push(topCushion);

    const botCushion = new THREE.Mesh(topCushionGeo, cushionMat);
    botCushion.position.set(0, cushionHeight / 2, TABLE_LENGTH / 2 - cushionWidth / 2);
    this.tableGroup.add(botCushion);
    this.cushionMeshes.push(botCushion);

    // Inner left & right side cushions (split for wide middle pockets)
    const sideCushionGeo = new THREE.BoxGeometry(cushionWidth, cushionHeight, (TABLE_LENGTH / 2) - 0.145);
    [-1, 1].forEach(sideX => {
      // Top half
      const scTop = new THREE.Mesh(sideCushionGeo, cushionMat);
      scTop.position.set(sideX * (TABLE_WIDTH / 2 - cushionWidth / 2), cushionHeight / 2, -TABLE_LENGTH / 4 - 0.006);
      this.tableGroup.add(scTop);
      this.cushionMeshes.push(scTop);

      // Bottom half
      const scBot = new THREE.Mesh(sideCushionGeo, cushionMat);
      scBot.position.set(sideX * (TABLE_WIDTH / 2 - cushionWidth / 2), cushionHeight / 2, TABLE_LENGTH / 4 + 0.006);
      this.tableGroup.add(scBot);
      this.cushionMeshes.push(scBot);
    });

    // 3.5. Professional Cloth Markings (Baulk Line, "D" arc, and Tournament Spots)
    const markingsMat = new THREE.MeshBasicMaterial({
      color: '#f8fafc',
      transparent: true,
      opacity: 0.42,
    });

    // Baulk Line across width at Z = 0.5m
    const baulkGeo = new THREE.PlaneGeometry(TABLE_WIDTH - 0.1, 0.0035);
    const baulkLine = new THREE.Mesh(baulkGeo, markingsMat);
    baulkLine.rotation.x = -Math.PI / 2;
    baulkLine.position.set(0, 0.001, 0.5);
    this.tableGroup.add(baulkLine);

    // "D" Semi-circle arc at Baulk Line (facing back toward bottom rail)
    const dPoints: THREE.Vector3[] = [];
    const dRadius = 0.22;
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI;
      dPoints.push(new THREE.Vector3(Math.cos(a) * dRadius, 0.0015, 0.5 + Math.sin(a) * dRadius));
    }
    const dGeo = new THREE.BufferGeometry().setFromPoints(dPoints);
    const dLine = new THREE.Line(dGeo, new THREE.LineBasicMaterial({ color: '#f8fafc', transparent: true, opacity: 0.42 }));
    this.tableGroup.add(dLine);

    // Tournament Spots: Head Spot, Center Spot, Foot Spot (Rack apex)
    const spotGeo = new THREE.CircleGeometry(0.0075, 16);
    const spotMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.65 });

    const headSpot = new THREE.Mesh(spotGeo, spotMat);
    headSpot.rotation.x = -Math.PI / 2;
    headSpot.position.set(0, 0.0015, 0.5);
    this.tableGroup.add(headSpot);

    const centerSpot = new THREE.Mesh(spotGeo, spotMat);
    centerSpot.rotation.x = -Math.PI / 2;
    centerSpot.position.set(0, 0.0015, 0);
    this.tableGroup.add(centerSpot);

    const footSpot = new THREE.Mesh(spotGeo, spotMat);
    footSpot.rotation.x = -Math.PI / 2;
    footSpot.position.set(0, 0.0015, -0.5);
    this.tableGroup.add(footSpot);

    // 3.6. 18 Mother-of-Pearl Diamond Aiming Sights (Inlaid along Wooden Rails)
    const diamondGeo = new THREE.CylinderGeometry(0.0055, 0.0055, 0.003, 4);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.15,
      metalness: 0.65,
    });

    const diamondZPositions = [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75];
    const diamondXPositions = [-0.35, 0, 0.35];

    // Left and Right Rail Sights (6 on each side)
    diamondZPositions.forEach(z => {
      const dLeft = new THREE.Mesh(diamondGeo, diamondMat);
      dLeft.position.set(-TABLE_WIDTH / 2 - railThickness / 2, railHeight / 2 - 0.015 + 0.002, z);
      dLeft.rotation.y = Math.PI / 4;
      this.tableGroup.add(dLeft);

      const dRight = new THREE.Mesh(diamondGeo, diamondMat);
      dRight.position.set(TABLE_WIDTH / 2 + railThickness / 2, railHeight / 2 - 0.015 + 0.002, z);
      dRight.rotation.y = Math.PI / 4;
      this.tableGroup.add(dRight);
    });

    // Top and Bottom Rail Sights (3 on each end)
    diamondXPositions.forEach(x => {
      const dTop = new THREE.Mesh(diamondGeo, diamondMat);
      dTop.position.set(x, railHeight / 2 - 0.015 + 0.002, -TABLE_LENGTH / 2 - railThickness / 2);
      dTop.rotation.y = Math.PI / 4;
      this.tableGroup.add(dTop);

      const dBot = new THREE.Mesh(diamondGeo, diamondMat);
      dBot.position.set(x, railHeight / 2 - 0.015 + 0.002, TABLE_LENGTH / 2 + railThickness / 2);
      dBot.rotation.y = Math.PI / 4;
      this.tableGroup.add(dBot);
    });

    // 4. Six Pocket Wells and Chrome Trim Brackets
    const pocketRimMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0', // Polished Chrome / Silver casting from reference photo
      roughness: 0.2,
      metalness: 0.92,
    });
    // Open leather drop cavity & dark drop cup (zero z-fighting noise with felt)
    const pocketWallMat = new THREE.MeshStandardMaterial({
      color: '#09090b',
      roughness: 0.88,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const pocketLeatherRimMat = new THREE.MeshStandardMaterial({
      color: '#18181b', // Heavy black leather pocket mouth facing
      roughness: 0.75,
      metalness: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.DoubleSide,
    });
    const pocketBaseMat = new THREE.MeshBasicMaterial({ color: '#030712' });

    POCKETS.forEach((p) => {
      // 1. Leather pocket mouth collar disc slightly above the felt - eliminates z-fighting distortion
      const collarGeo = new THREE.RingGeometry(p.radius * 0.85, p.radius * 1.05, 28);
      const collarMesh = new THREE.Mesh(collarGeo, pocketLeatherRimMat);
      collarMesh.rotation.x = -Math.PI / 2;
      collarMesh.position.set(p.x, 0.0012, p.z);
      this.tableGroup.add(collarMesh);

      // 2. Open-ended deep drop cylinder (interior pocket leather cup wall)
      const cavGeo = new THREE.CylinderGeometry(p.radius * 0.88, p.radius * 0.74, 0.065, 24, 1, true);
      const cavMesh = new THREE.Mesh(cavGeo, pocketWallMat);
      cavMesh.position.set(p.x, -0.038, p.z);
      this.tableGroup.add(cavMesh);

      // 3. Deep black drop cup bottom disc
      const baseGeo = new THREE.CircleGeometry(p.radius * 0.74, 24);
      const baseMesh = new THREE.Mesh(baseGeo, pocketBaseMat);
      baseMesh.rotation.x = -Math.PI / 2;
      baseMesh.position.set(p.x, -0.072, p.z);
      this.tableGroup.add(baseMesh);

      // 4. Metallic corner rim collar (beveled gold/chrome rim)
      const rimGeo = new THREE.TorusGeometry(p.radius * 1.04, 0.007, 10, 24);
      const rimMesh = new THREE.Mesh(rimGeo, pocketRimMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.set(p.x, 0.015, p.z);
      this.tableGroup.add(rimMesh);
    });

    // 4.5. 8 Ball Pool Style Corner & Side Pocket Casting Caps (Cast chrome metal housings)
    const cornerCapGeo = new THREE.BoxGeometry(railThickness * 1.15, railHeight * 1.02, railThickness * 1.15);
    const cornerCapPositions = [
      { x: -TABLE_WIDTH / 2 - railThickness / 2, z: -TABLE_LENGTH / 2 - railThickness / 2 },
      { x: TABLE_WIDTH / 2 + railThickness / 2, z: -TABLE_LENGTH / 2 - railThickness / 2 },
      { x: -TABLE_WIDTH / 2 - railThickness / 2, z: TABLE_LENGTH / 2 + railThickness / 2 },
      { x: TABLE_WIDTH / 2 + railThickness / 2, z: TABLE_LENGTH / 2 + railThickness / 2 },
    ];
    cornerCapPositions.forEach(pos => {
      const cap = new THREE.Mesh(cornerCapGeo, pocketRimMat);
      cap.position.set(pos.x, railHeight / 2 - 0.015, pos.z);
      cap.castShadow = true;
      this.tableGroup.add(cap);
    });

    // Side pocket chrome trim caps
    const sideCapGeo = new THREE.BoxGeometry(railThickness * 1.15, railHeight * 1.02, 0.10);
    [-1, 1].forEach(sideX => {
      const sideCap = new THREE.Mesh(sideCapGeo, pocketRimMat);
      sideCap.position.set(sideX * (TABLE_WIDTH / 2 + railThickness / 2), railHeight / 2 - 0.015, 0);
      sideCap.castShadow = true;
      this.tableGroup.add(sideCap);
    });

    // Golden Rail Inlay Pinstripes (signature luxury 8 Ball Pool design)
    const trimMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      roughness: 0.2,
      metalness: 0.9,
    });
    // Top & bottom pinstripe
    const trimTopBotGeo = new THREE.BoxGeometry(TABLE_WIDTH + railThickness * 2, 0.003, 0.003);
    const tTrim = new THREE.Mesh(trimTopBotGeo, trimMat);
    tTrim.position.set(0, railHeight - 0.014, -TABLE_LENGTH / 2 - railThickness);
    this.tableGroup.add(tTrim);

    const bTrim = new THREE.Mesh(trimTopBotGeo, trimMat);
    bTrim.position.set(0, railHeight - 0.014, TABLE_LENGTH / 2 + railThickness);
    this.tableGroup.add(bTrim);

    // Side pinstripes
    const trimSideGeo = new THREE.BoxGeometry(0.003, 0.003, TABLE_LENGTH);
    const lTrim = new THREE.Mesh(trimSideGeo, trimMat);
    lTrim.position.set(-TABLE_WIDTH / 2 - railThickness, railHeight - 0.014, 0);
    this.tableGroup.add(lTrim);

    const rTrim = new THREE.Mesh(trimSideGeo, trimMat);
    rTrim.position.set(TABLE_WIDTH / 2 + railThickness, railHeight - 0.014, 0);
    this.tableGroup.add(rTrim);

    // 5. Four Carved Wooden Legs with Brass Levelers
    const legGeo = new THREE.CylinderGeometry(0.065, 0.045, 0.72, 16);
    const brassFootGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.04, 16);
    const brassFootMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.2, metalness: 0.9 });

    const legPositions = [
      { x: -TABLE_WIDTH / 2 + 0.1, z: -TABLE_LENGTH / 2 + 0.18 },
      { x: TABLE_WIDTH / 2 - 0.1, z: -TABLE_LENGTH / 2 + 0.18 },
      { x: -TABLE_WIDTH / 2 + 0.1, z: TABLE_LENGTH / 2 - 0.18 },
      { x: TABLE_WIDTH / 2 - 0.1, z: TABLE_LENGTH / 2 - 0.18 },
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(pos.x, -0.4, pos.z);
      leg.castShadow = true;
      this.tableGroup.add(leg);

      const foot = new THREE.Mesh(brassFootGeo, brassFootMat);
      foot.position.set(pos.x, -0.74, pos.z);
      this.tableGroup.add(foot);
    });

    // 6. Contact Shadow Plane on the floor
    const shadowGeo = new THREE.PlaneGeometry(TABLE_WIDTH + 0.8, TABLE_LENGTH + 0.8);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d')!;
    const radGrad = sCtx.createRadialGradient(128, 128, 30, 128, 128, 120);
    radGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
    radGrad.addColorStop(0.6, 'rgba(0,0,0,0.3)');
    radGrad.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = radGrad;
    sCtx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);

    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    this.shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -0.755;
    this.scene.add(this.shadowPlane);

    // 7. Luxury Parquet Wood Floor Plane
    const floorGeo = new THREE.PlaneGeometry(14, 14);
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 512;
    floorCanvas.height = 512;
    const fCtx = floorCanvas.getContext('2d')!;
    fCtx.fillStyle = '#0f172a';
    fCtx.fillRect(0, 0, 512, 512);
    // Draw parquet planks pattern
    fCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    fCtx.lineWidth = 2;
    for (let x = 0; x < 512; x += 64) {
      fCtx.beginPath();
      fCtx.moveTo(x, 0);
      fCtx.lineTo(x, 512);
      fCtx.stroke();
    }
    for (let y = 0; y < 512; y += 32) {
      fCtx.beginPath();
      fCtx.moveTo(0, y);
      fCtx.lineTo(512, y);
      fCtx.stroke();
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(5, 5);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.45,
      metalness: 0.1,
      color: '#0b1120',
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.76;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);
  }

  // Build 3D multi-part procedural Cue Stick (fully proportioned 8-part model)
  private buildCueStick() {
    this.cueGroup = new THREE.Group();
    this.cuePitch = new THREE.Group();
    this.cueGroup.add(this.cuePitch);

    // 1. Tip (blue chalked leather)
    const tipGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.015, 12);
    const tipMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.9 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.z = 0.0075;
    tip.rotation.x = Math.PI / 2;
    this.cuePitch.add(tip);

    // 2. Ferrule (bright ivory white)
    const ferruleGeo = new THREE.CylinderGeometry(0.0068, 0.007, 0.025, 12);
    const ferruleMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.05 });
    const ferrule = new THREE.Mesh(ferruleGeo, ferruleMat);
    ferrule.position.z = 0.0275;
    ferrule.rotation.x = Math.PI / 2;
    this.cuePitch.add(ferrule);

    // 3. Maple Shaft (smooth polished wooden taper)
    const shaftGeo = new THREE.CylinderGeometry(0.007, 0.011, 0.58, 14);
    const shaftMat = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.35, metalness: 0.05 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.z = 0.33;
    shaft.rotation.x = Math.PI / 2;
    this.cuePitch.add(shaft);

    // 4. Metallic Joint Collar (Gold/Chrome accent ring)
    const jointGeo = new THREE.CylinderGeometry(0.0112, 0.0115, 0.02, 14);
    const jointMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.2, metalness: 0.85 });
    const joint = new THREE.Mesh(jointGeo, jointMat);
    joint.position.z = 0.63;
    joint.rotation.x = Math.PI / 2;
    this.cuePitch.add(joint);

    // 5. Forearm (rich stained wood)
    const forearmGeo = new THREE.CylinderGeometry(0.0115, 0.014, 0.22, 14);
    const forearmMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.3, metalness: 0.1 });
    const forearm = new THREE.Mesh(forearmGeo, forearmMat);
    forearm.position.z = 0.75;
    forearm.rotation.x = Math.PI / 2;
    this.cuePitch.add(forearm);

    // 6. Irish Linen Handle Wrap (checkered textured grip)
    const wrapTex = getCueWrapTexture('#18181b');
    const wrapGeo = new THREE.CylinderGeometry(0.014, 0.015, 0.26, 14);
    const wrapMat = new THREE.MeshStandardMaterial({
      color: '#18181b',
      map: wrapTex,
      roughness: 0.65,
      metalness: 0.1,
    });
    const wrap = new THREE.Mesh(wrapGeo, wrapMat);
    wrap.position.z = 0.99;
    wrap.rotation.x = Math.PI / 2;
    this.cuePitch.add(wrap);

    // 7. Butt Sleeve Accent Ring
    const buttRingGeo = new THREE.CylinderGeometry(0.015, 0.0152, 0.015, 14);
    const buttRing = new THREE.Mesh(buttRingGeo, jointMat);
    buttRing.position.z = 1.1275;
    buttRing.rotation.x = Math.PI / 2;
    this.cuePitch.add(buttRing);

    // 8. Butt Cap & Rubber Bumper (end of cue)
    const buttGeo = new THREE.CylinderGeometry(0.0152, 0.0158, 0.045, 14);
    const buttMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4, metalness: 0.2 });
    const butt = new THREE.Mesh(buttGeo, buttMat);
    butt.position.z = 1.1575;
    butt.rotation.x = Math.PI / 2;

    const parts = [tip, ferrule, shaft, joint, forearm, wrap, buttRing, butt];
    this.cueMeshParts = parts;
    parts.forEach(part => {
      part.castShadow = !this.isSoftwareGl;
      part.receiveShadow = false;
      part.renderOrder = 20;
      this.cuePitch.add(part);
    });

    this.scene.add(this.cueGroup);
  }

  // Trajectory Prediction Guides
  private buildTrajectoryVisuals() {
    this.trajectoryGroup = new THREE.Group();

    // Cue line (laser / dashed white)
    const lineGeo1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, BALL_RADIUS, 0),
      new THREE.Vector3(0, BALL_RADIUS, -1)
    ]);
    const lineMat1 = new THREE.LineDashedMaterial({
      color: '#ffffff',
      dashSize: 0.02,
      gapSize: 0.015,
      linewidth: 2,
    });
    this.aimLineMesh = new THREE.Line(lineGeo1, lineMat1);
    this.aimLineMesh.computeLineDistances();
    this.trajectoryGroup.add(this.aimLineMesh);

    // Target Ball line (Bright Gold)
    const lineGeo2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, BALL_RADIUS, 0),
      new THREE.Vector3(0, BALL_RADIUS, -0.5)
    ]);
    const lineMat2 = new THREE.LineBasicMaterial({
      color: '#facc15',
      linewidth: 3,
    });
    this.targetLineMesh = new THREE.Line(lineGeo2, lineMat2);
    this.trajectoryGroup.add(this.targetLineMesh);

    // Cue deflection line (Cyan)
    const lineGeo3 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, BALL_RADIUS, 0),
      new THREE.Vector3(0, BALL_RADIUS, -0.3)
    ]);
    const lineMat3 = new THREE.LineBasicMaterial({
      color: '#38bdf8',
      linewidth: 2,
    });
    this.cueDeflectLineMesh = new THREE.Line(lineGeo3, lineMat3);
    this.trajectoryGroup.add(this.cueDeflectLineMesh);

    // Ghost Cue Ball (translucent sphere)
    const ghostGeo = new THREE.SphereGeometry(BALL_RADIUS, 16, 16);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    this.ghostCueMesh = new THREE.Mesh(ghostGeo, ghostMat);
    this.trajectoryGroup.add(this.ghostCueMesh);

    this.scene.add(this.trajectoryGroup);
  }

  // Build Ball Differentiation Markers Group
  private buildBallMarkers() {
    this.markersGroup = new THREE.Group();
    this.scene.add(this.markersGroup);
  }

  // Build Ball-in-Hand Placement Target Ring Visual
  private buildBallInHandVisual() {
    this.ballInHandGroup = new THREE.Group();

    // 1. Concentric target ring on the felt cloth
    const outerRingGeo = new THREE.RingGeometry(BALL_RADIUS * 1.35, BALL_RADIUS * 1.7, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.002;
    this.ballInHandGroup.add(outerRing);

    // Inner pulsing target disc
    const innerDiscGeo = new THREE.CircleGeometry(BALL_RADIUS * 0.9, 24);
    const innerDiscMat = new THREE.MeshBasicMaterial({
      color: '#0284c7',
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const innerDisc = new THREE.Mesh(innerDiscGeo, innerDiscMat);
    innerDisc.rotation.x = -Math.PI / 2;
    innerDisc.position.y = 0.0018;
    this.ballInHandGroup.add(innerDisc);

    // 4 Directional indicator ticks (Target crosshairs)
    const tickGeo = new THREE.PlaneGeometry(0.006, 0.035);
    const tickMat = new THREE.MeshBasicMaterial({ color: '#facc15', side: THREE.DoubleSide, depthWrite: false });
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(rot => {
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.rotation.x = -Math.PI / 2;
      tick.rotation.z = rot;
      tick.position.set(Math.sin(rot) * (BALL_RADIUS * 2.1), 0.0022, Math.cos(rot) * (BALL_RADIUS * 2.1));
      this.ballInHandGroup.add(tick);
    });

    this.ballInHandGroup.visible = false;
    this.scene.add(this.ballInHandGroup);
  }

  // 3D Raycast to determine exact point on the billiard table felt
  public getTableIntersection(clientX: number, clientY: number): THREE.Vector3 | null {
    if (!this.container || !this.camera) return null;
    const rect = this.container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.pointerNdc.set(x, y);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.tablePlane, target);
    return hit ? target : null;
  }

  // Sync 3D Ball Meshes and Player Ball Markers
  public syncBalls(
    balls: BallState[], 
    ballSkinStyle = 'classic',
    playerGroups?: [PlayerGroup, PlayerGroup],
    currentPlayerIndex: number = 0,
    gameMode: string = '8ball',
    targetBallId: number | null = null,
    dt: number = 0.016
  ) {
    this.markerAnimTime += dt;
    const activeBallIds = new Set(balls.map(b => b.id));

    // 1. Remove meshes and markers for balls that are no longer active
    for (const [id, mesh] of this.ballMeshes.entries()) {
      if (!activeBallIds.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.ballMeshes.delete(id);
      }
    }

    for (const [id, marker] of this.ballMarkerItems.entries()) {
      if (!activeBallIds.has(id)) {
        this.markersGroup.remove(marker.group);
        marker.ringMesh.geometry.dispose();
        (marker.ringMesh.material as THREE.Material).dispose();
        marker.sprite.geometry.dispose();
        (marker.sprite.material as THREE.Material).dispose();
        this.ballMarkerItems.delete(id);
      }
    }

    // Helper to evaluate each ball's ownership and legal target status
    const getMarkerInfo = (ballId: number): { type: MarkerOwnerType; isTarget: boolean } => {
      if (ballId === 0) return { type: 'none', isTarget: false };

      if (gameMode === '8ball') {
        const p1Group = playerGroups ? playerGroups[0] : 'unassigned';
        const p2Group = playerGroups ? playerGroups[1] : 'unassigned';

        // Open Table: before groups are determined, no colors or badges around balls!
        // User request: "و قم بإزالة الالوان حول الكرات قبل تحديدها"
        if (p1Group === 'unassigned') {
          return { type: 'none', isTarget: false };
        }

        // 8-ball logic
        if (ballId === 8) {
          const remSolids = balls.filter(b => b.id >= 1 && b.id <= 7 && !b.inPocket).length;
          const remStripes = balls.filter(b => b.id >= 9 && b.id <= 15 && !b.inPocket).length;
          const currentGroup = currentPlayerIndex === 0 ? p1Group : p2Group;
          const isCleared = (currentGroup === 'solids' && remSolids === 0) ||
                            (currentGroup === 'stripes' && remStripes === 0);

          if (isCleared) {
            return { type: 'eight_win', isTarget: true };
          }
          return { type: 'eight_wait', isTarget: false };
        }

        const isSolid = ballId >= 1 && ballId <= 7;
        let owner: 'p1' | 'p2' = 'p1';
        if (p1Group === 'solids') {
          owner = isSolid ? 'p1' : 'p2';
        } else {
          owner = isSolid ? 'p2' : 'p1';
        }

        const isCurrentTurn = (currentPlayerIndex === 0 && owner === 'p1') || (currentPlayerIndex === 1 && owner === 'p2');
        return { type: owner, isTarget: isCurrentTurn };
      } else if (gameMode === '9ball') {
        const activeBalls = balls.filter(b => b.id >= 1 && b.id <= 9 && !b.inPocket);
        activeBalls.sort((a, b) => a.id - b.id);
        const lowestId = activeBalls.length > 0 ? activeBalls[0].id : null;

        if (ballId === lowestId) {
          return { type: 'nine_target', isTarget: true };
        }
        if (ballId === 9) {
          return { type: 'eight_win', isTarget: false };
        }
        return { type: 'open', isTarget: false };
      }

      return { type: 'open', isTarget: true };
    };

    // 2. Update or create ball meshes and markers
    balls.forEach((b) => {
      let mesh = this.ballMeshes.get(b.id);
      if (!mesh) {
        const tex = getBallTexture(b.id, ballSkinStyle);
        const geo = new THREE.SphereGeometry(BALL_RADIUS, 24, 24);
        const mat = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.15,
          metalness: 0.05,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = !this.isSoftwareGl;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.ballMeshes.set(b.id, mesh);
      }

      // Ball position & rotation
      mesh.position.set(b.x, b.y, b.z);
      _euler.set(b.rotX, 0, b.rotZ, 'XYZ');
      mesh.quaternion.setFromEuler(_euler);

      if (b.inPocket) {
        // Keep ball at full natural size as it enters and drops over the lip,
        // and only shrink smoothly once it is deep down inside the pocket drop cup
        const deepProgress = Math.max(0, (b.pocketDropProgress - 0.35) / 0.65);
        mesh.scale.setScalar(Math.max(0.01, 1 - deepProgress * 0.55));
        if (b.pocketDropProgress >= 0.98 || b.y <= -0.06) {
          mesh.visible = false;
        }
      } else {
        mesh.visible = true;
        mesh.scale.setScalar(1);
      }

      // Ball differentiation markers on table (for object balls 1-15)
      if (b.id !== 0) {
        const markerInfo = getMarkerInfo(b.id);
        let markerItem = this.ballMarkerItems.get(b.id);

        if (!markerItem) {
          const markerGroup = new THREE.Group();

          // 1. Halo Ground Ring on Cloth (encircling the ball)
          const ringGeo = new THREE.RingGeometry(BALL_RADIUS * 1.05, BALL_RADIUS * 1.38, 28);
          const ringMat = new THREE.MeshBasicMaterial({
            color: '#38bdf8',
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = -Math.PI / 2;
          ringMesh.position.y = 0.0018;
          markerGroup.add(ringMesh);

          // 2. 3D Billboard Sprite Floating Above Ball
          const spriteMat = new THREE.SpriteMaterial({
            map: getBallMarkerTexture(b.id, markerInfo.type),
            transparent: true,
            opacity: 0.95,
            depthWrite: false,
          });
          const sprite = new THREE.Sprite(spriteMat);
          sprite.scale.set(0.046, 0.046, 1);
          sprite.position.y = BALL_RADIUS * 2 + 0.024;
          markerGroup.add(sprite);

          this.markersGroup.add(markerGroup);
          markerItem = {
            group: markerGroup,
            ringMesh,
            sprite,
            currentType: markerInfo.type,
          };
          this.ballMarkerItems.set(b.id, markerItem);
        }

        // USER REQUIREMENT:
        // "قم بإزالة الدائرات الملونة على الكرات يجب فقط ان تتلون باللون الأحمر عندما يريد ان يضربها شخص ليست له"
        // 1. Remove all permanent colored rings and billboard badges from the balls!
        // 2. ONLY display a pulsing RED warning ring when the player is aiming at a ball that DOES NOT belong to them!
        const isAimedAt = targetBallId === b.id;
        const isIllegalTarget = isAimedAt && !markerInfo.isTarget;

        if (b.inPocket || !isIllegalTarget) {
          // No circle at all! Balls remain completely clean, authentic and realistic.
          markerItem.group.visible = false;
        } else {
          // Only show the red warning circle when trying to strike an illegal ball / opponent's ball
          markerItem.group.visible = true;
          markerItem.group.position.set(b.x, 0, b.z);

          // Hide floating billboard sprite
          markerItem.sprite.visible = false;

          const ringMat = markerItem.ringMesh.material as THREE.MeshBasicMaterial;
          ringMat.color.set('#ef4444'); // Vivid Red warning
          ringMat.opacity = 0.92;

          // Pulsing warning animation so the player immediately notices the illegal contact
          const pulse = 1.25 + Math.sin(this.markerAnimTime * 8) * 0.12;
          markerItem.ringMesh.scale.setScalar(pulse);
        }
      }
    });
  }

  // Update Aim, Cue Stick Position, and Trajectory
  public updateAim(
    cuePos: { x: number; z: number },
    angle: number,
    power: number,
    trajectory: TrajectoryPrediction,
    isAiming: boolean,
    isShooting: boolean,
    strikeProgress: number,
    isBallInHand: boolean = false
  ) {
    this.currentAimAngle = angle;
    this.currentPower = power;
    this.isAiming = isAiming;
    this.isShooting = isShooting;
    this.strikeProgress = strikeProgress;

    // When Ball-in-Hand is active: hide cue stick and trajectory line, show pulsing placement ring
    if (isBallInHand) {
      this.cueGroup.visible = false;
      this.trajectoryGroup.visible = false;
      this.ballInHandGroup.visible = true;
      this.ballInHandGroup.position.set(cuePos.x, 0, cuePos.z);
      const pulse = 1 + Math.sin(Date.now() * 0.007) * 0.08;
      this.ballInHandGroup.scale.set(pulse, 1, pulse);
      return;
    }

    this.ballInHandGroup.visible = false;

    // 1. Cue Stick Orientation & Pullback (Sloping gracefully UPWARD above the table)
    if (this.isAiming && !isShooting) {
      this.cueGroup.visible = true;
      this.trajectoryGroup.visible = true;

      // Pullback distance based on power (0 to 0.18m)
      const pullback = 0.02 + power * 0.16;

      // Aim direction vector towards target
      const dirX = Math.sin(angle);
      const dirZ = -Math.cos(angle);

      // Cue tip rests behind cue ball along collinear line
      const cuePosX = cuePos.x - dirX * (BALL_RADIUS + pullback);
      const cuePosZ = cuePos.z - dirZ * (BALL_RADIUS + pullback);

      // Elevation & Rail clearance:
      // Negative pitch around X in Three.js tilts positive-Z stick body upwards into the air above the table
      const distToRailX = Math.min(
        Math.abs(cuePos.x - (-TABLE_WIDTH / 2)),
        Math.abs(cuePos.x - (TABLE_WIDTH / 2))
      );
      const distToRailZ = Math.min(
        Math.abs(cuePos.z - (-TABLE_LENGTH / 2)),
        Math.abs(cuePos.z - (TABLE_LENGTH / 2))
      );
      const nearCushion = Math.min(distToRailX, distToRailZ) < 0.11;
      const pitchAngle = nearCushion ? -0.11 : -0.075;
      const cueTipHeight = BALL_RADIUS + (nearCushion ? 0.012 : 0.007);

      this.cueGroup.position.set(cuePosX, cueTipHeight, cuePosZ);
      this.cueGroup.rotation.set(0, -angle, 0); // Mathematically aligned with aim vector
      this.cuePitch.rotation.set(pitchAngle, 0, 0); // Tilts stick upward above the table (butt sits 12-16cm high)
    } else if (isShooting) {
      // Strike forward animation
      this.cueGroup.visible = true;
      this.trajectoryGroup.visible = false;

      const pullback = 0.02 + power * 0.16;
      const strikeOffset = pullback * (1 - strikeProgress * 1.35);

      const dirX = Math.sin(angle);
      const dirZ = -Math.cos(angle);

      const distToRailX = Math.min(
        Math.abs(cuePos.x - (-TABLE_WIDTH / 2)),
        Math.abs(cuePos.x - (TABLE_WIDTH / 2))
      );
      const distToRailZ = Math.min(
        Math.abs(cuePos.z - (-TABLE_LENGTH / 2)),
        Math.abs(cuePos.z - (TABLE_LENGTH / 2))
      );
      const nearCushion = Math.min(distToRailX, distToRailZ) < 0.11;
      const pitchAngle = nearCushion ? -0.11 : -0.075;
      const cueTipHeight = BALL_RADIUS + (nearCushion ? 0.012 : 0.007);

      this.cueGroup.position.set(
        cuePos.x - dirX * (BALL_RADIUS + strikeOffset),
        cueTipHeight,
        cuePos.z - dirZ * (BALL_RADIUS + strikeOffset)
      );
      this.cueGroup.rotation.set(0, -angle, 0);
      this.cuePitch.rotation.set(pitchAngle, 0, 0);
    } else {
      this.cueGroup.visible = false;
      this.trajectoryGroup.visible = false;
    }

    // 2. Trajectory Prediction Lines
    if (this.isAiming && !isShooting && trajectory.cueLine.length > 1) {
      // Aim line
      const points1 = trajectory.cueLine.map(p => new THREE.Vector3(p.x, BALL_RADIUS * 0.5, p.z));
      this.aimLineMesh.geometry.dispose();
      this.aimLineMesh.geometry = new THREE.BufferGeometry().setFromPoints(points1);
      this.aimLineMesh.computeLineDistances();

      // Ghost cue ball
      if (trajectory.ghostCuePos) {
        this.ghostCueMesh.visible = true;
        this.ghostCueMesh.position.set(trajectory.ghostCuePos.x, BALL_RADIUS, trajectory.ghostCuePos.z);
      } else {
        this.ghostCueMesh.visible = false;
      }

      // Target ball deflection line
      if (trajectory.targetBallLine.length > 1) {
        this.targetLineMesh.visible = true;
        const points2 = trajectory.targetBallLine.map(p => new THREE.Vector3(p.x, BALL_RADIUS * 0.5, p.z));
        this.targetLineMesh.geometry.dispose();
        this.targetLineMesh.geometry = new THREE.BufferGeometry().setFromPoints(points2);
      } else {
        this.targetLineMesh.visible = false;
      }

      // Cue ball deflection line
      if (trajectory.deflectionCueLine.length > 1) {
        this.cueDeflectLineMesh.visible = true;
        const points3 = trajectory.deflectionCueLine.map(p => new THREE.Vector3(p.x, BALL_RADIUS * 0.5, p.z));
        this.cueDeflectLineMesh.geometry.dispose();
        this.cueDeflectLineMesh.geometry = new THREE.BufferGeometry().setFromPoints(points3);
      } else {
        this.cueDeflectLineMesh.visible = false;
      }
    } else {
      this.trajectoryGroup.visible = false;
    }
  }

  // Smooth camera positioning and transitions
  // User Requirements:
  // 1. Overhead top-down camera during gameplay ("عند اللعب يجب ان تكون الكاميرة من الفوق")
  // 2. Do NOT follow or track white ball ("عدم تتبع الكرة البيضاء")
  // 3. Elevate higher when cue ball is struck ("عند ضرب الكرة البيضاء يمكن ان ترتفع الكاميرة")
  // 4. Can zoom in / get closer ("عند اللعب يمكن الاقتراب")
  // Dynamic orientation and smooth camera positioning
  // USER REQUIREMENT:
  // "عندما أقوم بقلب الهاتف عموديا اريد ان تصبح طاولة اللعب عمودية"
  // When the phone is turned vertically (portrait), the billiard table becomes vertical!
  // When in landscape, the table aligns horizontally to fit widescreen.
  public updateCamera(cuePos: { x: number; z: number }, dt: number, isAiming: boolean = true) {
    const w = this.container?.clientWidth || window.innerWidth;
    const h = this.container?.clientHeight || window.innerHeight;
    const isPortrait = h > w;
    this.isPortrait = isPortrait;

    const aspect = Math.max(0.1, this.camera.aspect || (w / h));
    const halfFovRad = (this.camera.fov * Math.PI) / 360;
    const tanHalfFov = Math.tan(halfFovRad); // ~0.4142

    const tableLengthWithMargin = 2.45;
    const tableWidthWithMargin = 1.38;

    if (this.viewMode === 'aim') {
      // 3D Perspective Mode ("ميزة 3D أثناء اللعب"):
      // Camera is positioned at realistic eye-level behind the cue stick looking along the aim vector!
      if (isAiming && !this.isShooting) {
        const dirX = Math.sin(this.currentAimAngle);
        const dirZ = -Math.cos(this.currentAimAngle);
        const distBehind = 0.68;
        const camHeight = 0.35 * (this.zoomHeight / 1.95);

        this.targetUp.set(0, 1, 0);
        this.targetCamPos.set(
          cuePos.x - dirX * distBehind,
          camHeight,
          cuePos.z - dirZ * distBehind
        );
        this.targetCamLookAt.set(
          cuePos.x + dirX * 1.2,
          BALL_RADIUS * 1.4,
          cuePos.z + dirZ * 1.2
        );
      } else {
        // Dynamic cinematic 3D overview during ball motion / strike
        this.targetUp.set(0, 1, 0);
        const dist = 1.9 * (this.zoomHeight / 1.95);
        this.targetCamPos.set(0.15, dist, 0.95);
        this.targetCamLookAt.set(0, 0, 0);
      }
    } else if (this.viewMode === 'top') {
      // 2D Classic Overhead View (Matches 8 Ball Pool reference screenshot)
      if (isPortrait) {
        // Vertical table orientation: length along Z runs vertically along phone screen
        this.targetUp.set(0, 0, -1);

        const heightForLength = (tableLengthWithMargin / 2) / tanHalfFov;
        const heightForWidth = (tableWidthWithMargin / 2) / (tanHalfFov * aspect);
        const baseHeight = Math.max(heightForLength, heightForWidth) * (this.zoomHeight / 1.95);
        const targetHeight = (!isAiming || this.isShooting) ? baseHeight + 0.55 : baseHeight;

        this.targetCamPos.set(0, targetHeight, 0.001);
        this.targetCamLookAt.set(0, 0, 0);
      } else {
        // Horizontal table orientation: length along Z runs horizontally across landscape screen
        this.targetUp.set(-1, 0, 0);

        const heightForWidth = (tableWidthWithMargin / 2) / tanHalfFov;
        const heightForLength = (tableLengthWithMargin / 2) / (tanHalfFov * aspect);
        const baseHeight = Math.max(1.80, Math.max(heightForWidth, heightForLength)) * (this.zoomHeight / 1.95);
        const targetHeight = (!isAiming || this.isShooting) ? baseHeight + 0.55 : baseHeight;

        this.targetCamPos.set(0, targetHeight, 0.001);
        this.targetCamLookAt.set(0, 0, 0);
      }
    } else if (this.viewMode === 'free') {
      this.targetUp.set(0, 1, 0);
      const radY = this.orbitAngleY;
      const radX = this.orbitAngleX;
      const x = Math.sin(radX) * Math.cos(radY) * this.orbitDistance;
      const y = Math.sin(radY) * this.orbitDistance;
      const z = Math.cos(radX) * Math.cos(radY) * this.orbitDistance;

      this.targetCamPos.set(x, y, z);
      this.targetCamLookAt.set(0, 0, 0);
    }

    // Smoothly interpolate camera up-vector for seamless transitions
    this.curUp.lerp(this.targetUp, Math.min(1.0, dt * 10.0));
    this.camera.up.copy(this.curUp);

    // Smooth exponential damping
    const lambda = (!isAiming || this.isShooting) ? 5.5 : 9.0;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCamPos.x, lambda, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCamPos.y, lambda, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCamPos.z, lambda, dt);

    this.curCamLookAt.x = THREE.MathUtils.damp(this.curCamLookAt.x, this.targetCamLookAt.x, lambda, dt);
    this.curCamLookAt.y = THREE.MathUtils.damp(this.curCamLookAt.y, this.targetCamLookAt.y, lambda, dt);
    this.curCamLookAt.z = THREE.MathUtils.damp(this.curCamLookAt.z, this.targetCamLookAt.z, lambda, dt);

    this.camera.lookAt(this.curCamLookAt);
  }

  // Snap camera directly to current target without damping delay (prevents black screen on startup)
  public snapCamera() {
    if (!this.camera) return;
    this.camera.position.copy(this.targetCamPos);
    this.curCamLookAt.copy(this.targetCamLookAt);
    this.curUp.copy(this.targetUp);
    this.camera.up.copy(this.curUp);
    this.camera.lookAt(this.curCamLookAt);
    this.onResize();
  }

  // Zoom controls ("عند اللعب يمكن الاقتراب")
  public zoomIn(delta = 0.22) {
    this.zoomHeight = Math.max(1.20, this.zoomHeight - delta);
  }

  public zoomOut(delta = 0.22) {
    this.zoomHeight = Math.min(2.85, this.zoomHeight + delta);
  }

  public setZoom(height: number) {
    this.zoomHeight = Math.max(1.20, Math.min(2.85, height));
  }

  // Update Cue stick finishes based on equipped cue
  public applyCueItem(cue: CueItem) {
    if (!this.cueGroup || !this.cueMeshParts || this.cueMeshParts.length < 8) return;
    const [tip, ferrule, shaft, joint, forearm, wrap, buttRing, butt] = this.cueMeshParts;

    // Tip
    if (tip && tip.material instanceof THREE.MeshStandardMaterial) {
      tip.material.color.set(cue.accentColor || '#0284c7');
    }

    // Ferrule
    if (ferrule && ferrule.material instanceof THREE.MeshStandardMaterial) {
      ferrule.material.color.set(cue.shaftMaterial === 'gold' ? '#fef08a' : '#f8fafc');
    }

    // Shaft material
    if (shaft && shaft.material instanceof THREE.MeshStandardMaterial) {
      switch (cue.shaftMaterial) {
        case 'carbon':
          shaft.material.color.set('#27272a');
          shaft.material.roughness = 0.28;
          shaft.material.metalness = 0.4;
          break;
        case 'gold':
          shaft.material.color.set('#eab308');
          shaft.material.roughness = 0.18;
          shaft.material.metalness = 0.88;
          break;
        case 'neon':
          shaft.material.color.set(cue.primaryColor || '#06b6d4');
          shaft.material.roughness = 0.2;
          shaft.material.metalness = 0.5;
          break;
        case 'obsidian':
          shaft.material.color.set('#09090b');
          shaft.material.roughness = 0.12;
          shaft.material.metalness = 0.7;
          break;
        case 'maple':
          shaft.material.color.set('#fde68a');
          shaft.material.roughness = 0.35;
          shaft.material.metalness = 0.05;
          break;
        case 'birch':
        default:
          shaft.material.color.set('#fed7aa');
          shaft.material.roughness = 0.38;
          shaft.material.metalness = 0.05;
          break;
      }
      shaft.material.needsUpdate = true;
    }

    // Joint and Butt Ring metallic accents
    const accentColor = cue.accentColor || '#eab308';
    [joint, buttRing].forEach(m => {
      if (m && m.material instanceof THREE.MeshStandardMaterial) {
        m.material.color.set(accentColor);
        m.material.metalness = 0.85;
        m.material.roughness = 0.2;
        m.material.needsUpdate = true;
      }
    });

    // Forearm & Butt
    const primaryColor = cue.primaryColor || '#854d0e';
    [forearm, butt].forEach(m => {
      if (m && m.material instanceof THREE.MeshStandardMaterial) {
        m.material.color.set(primaryColor);
        m.material.roughness = 0.25;
        m.material.metalness = cue.shaftMaterial === 'gold' || cue.shaftMaterial === 'carbon' ? 0.4 : 0.1;
        m.material.needsUpdate = true;
      }
    });

    // Linen Wrap
    if (wrap && wrap.material instanceof THREE.MeshStandardMaterial) {
      wrap.material.map = getCueWrapTexture(accentColor);
      wrap.material.color.set(primaryColor);
      wrap.material.needsUpdate = true;
    }
  }

  // Update Table Felt and Frame customization
  public applyTableSkin(tableSkin: TableSkin) {
    const defaultTableTexture = '/assets/aistudio/897605018_1801695377894810_7053844980198404968_n_0e54bafe.jpg';
    const textureUrl = tableSkin.textureUrl || (tableSkin.id === 'table_classic_8bp' ? defaultTableTexture : undefined);

    const feltTex = getFeltTexture(tableSkin.feltColor, 4, textureUrl, () => {
      this.render();
    });
    const feltMat = this.feltMesh.material as THREE.MeshStandardMaterial;
    feltMat.map = feltTex;
    feltMat.color.set(textureUrl ? '#ffffff' : tableSkin.feltColor);
    feltMat.needsUpdate = true;

    // Update cushions to match table felt
    if (this.cushionMaterial) {
      this.cushionMaterial.color.set(tableSkin.feltColor);
      this.cushionMaterial.needsUpdate = true;
    }

    // Sanitize frameColor to rich mahogany '#7a3311' if legacy/default
    const frameColor = (tableSkin.frameColor === '#3d1d11' || !tableSkin.frameColor) ? '#7a3311' : tableSkin.frameColor;
    const woodTex = getWoodTexture(frameColor);
    this.woodRailMeshes.forEach(mesh => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.map = woodTex;
      mat.color.set(frameColor);
      mat.needsUpdate = true;
    });

    this.render();
  }

  public onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth || window.innerWidth || 1280;
    const h = this.container.clientHeight || window.innerHeight || 720;
    if (w <= 0 || h <= 0) return;
    this.isPortrait = h > w;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public render() {
    if (this.isDisposed) return;
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
