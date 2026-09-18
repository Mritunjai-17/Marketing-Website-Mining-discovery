"use client";

import React, { useEffect, useRef } from "react";

export interface AtmosphericCloudLayerProps {
  /** Master transition progress (0..1) */
  progress: number;
}

function clamp01(x: number) {
  return Math.min(Math.max(x, 0), 1);
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const VS_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FS_SOURCE = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_progress;
uniform float u_part;
uniform float u_opacity;
uniform float u_isMobile;
uniform sampler2D u_cloudTex;
uniform sampler2D u_cloudMobileTex;
uniform sampler2D u_wispTex;

// Fast Simplex-style noise for organic fluid turbulence
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float f = 0.0;
  f += 0.5000 * snoise(p); p *= 2.02;
  f += 0.2500 * snoise(p); p *= 2.03;
  f += 0.1250 * snoise(p); p *= 2.01;
  f += 0.0625 * snoise(p);
  return f;
}

void main() {
  vec2 screenUV = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  bool isMobile = u_isMobile > 0.5 || aspect < 1.0;

  // Center coordinate in screen space
  float distFromCenter = abs(screenUV.x - 0.5);
  float side = sign(screenUV.x - 0.5);

  // Fit textures to cover viewport perfectly without stretching or empty borders
  vec2 baseUV = screenUV;
  if (isMobile) {
    // Dedicated mobile texture is 9:16 portrait (aspect = 0.5625)
    float mobileAspect = 9.0 / 16.0;
    if (aspect < mobileAspect) {
      // Very tall screen (e.g. 9:19.5, iPhone)
      float scale = aspect / mobileAspect;
      baseUV.x = (screenUV.x - 0.5) * scale + 0.5;
    } else {
      // Slightly wider portrait screen
      float scale = mobileAspect / aspect;
      baseUV.y = (screenUV.y - 0.5) * scale + 0.5;
    }
  } else {
    // Desktop texture is 16:9 landscape
    float desktopAspect = 16.0 / 9.0;
    if (aspect > desktopAspect) {
      // Ultrawide screen
      float scale = desktopAspect / aspect;
      baseUV.y = (screenUV.y - 0.46) * scale + 0.46;
    } else {
      // Standard or squarer desktop screen
      float scale = aspect / desktopAspect;
      baseUV.x = (screenUV.x - 0.5) * scale + 0.5;
    }
  }

  // Living fluid turbulence in the atmosphere
  vec2 noiseCoord = screenUV * vec2(aspect * 2.2, 2.2) + vec2(0.0, u_time * 0.035);
  float n1 = fbm(noiseCoord);
  float n2 = fbm(noiseCoord + vec2(4.3, 1.8) + vec2(n1 * 0.35, n1 * 0.35));

  // Atmospheric descent: perspective expansion outwards from center as camera dives down
  float easePart = pow(u_part, 1.25);
  vec2 centeredUV = baseUV - vec2(0.5, 0.5);
  float zoomFactor = 1.0 + easePart * 0.78;
  vec2 zoomedUV = centeredUV * zoomFactor + vec2(0.5, 0.5);

  // Lateral and vertical organic billowing dispersal outward to the sides
  float pushX = side * easePart * (isMobile ? 0.95 : 0.85) * (1.0 + n1 * 0.25);
  float pushY = (n2 - 0.2) * easePart * 0.22 - easePart * 0.10;

  vec2 displacedUV = zoomedUV - vec2(pushX, pushY);

  // Sample authentic cloud textures: dedicated vertical portrait texture on mobile, landscape on desktop
  vec4 cloudCol = isMobile ? texture2D(u_cloudMobileTex, displacedUV) : texture2D(u_cloudTex, displacedUV);
  vec4 wispCol = texture2D(u_wispTex, displacedUV * 1.35 + vec2(n1 * 0.06, n2 * 0.06));

  // Volumetric cloud blend
  vec3 rgb = mix(cloudCol.rgb, wispCol.rgb + vec3(0.06, 0.04, 0.02), isMobile ? 0.20 : 0.32);

  // Sunlight highlight on the inner crests of the parting clouds as land appears
  float edgeLight = smoothstep(0.06, 0.32, distFromCenter) * (1.0 - smoothstep(0.32, 0.62, distFromCenter));
  rgb += vec3(0.92, 0.72, 0.42) * edgeLight * u_part * 0.45;

  // Organic cloud parting opening:
  // Clouds swiftly roll away to the left and right sides
  float voidNoise = n1 * 0.18 + n2 * 0.12;
  float openingRadius = easePart * 0.74 + voidNoise;
  
  float centerAlpha = smoothstep(openingRadius - 0.20, openingRadius + 0.14, distFromCenter);

  // Initial solid coverage: 100% full screen blanket when u_part == 0
  if (u_part <= 0.005) {
    centerAlpha = 1.0;
  }

  // Flank fadeout as clouds reach screen boundaries
  float flankFade = 1.0;
  if (u_part > 0.62) {
    flankFade = 1.0 - smoothstep(0.62, 1.0, u_part);
  }

  float finalAlpha = centerAlpha * flankFade * u_opacity;

  // Cinematic tone curve
  rgb = pow(rgb, vec3(0.92));

  gl_FragColor = vec4(rgb, finalAlpha);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function loadTexture(gl: WebGLRenderingContext, url: string, callback?: () => void): WebGLTexture | null {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Flip Y so HTML images render right-side up (clouds downside, sky upside)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Single pixel placeholder while loading
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([230, 235, 245, 255])
  );

  const img = new Image();
  img.src = url;
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (callback) callback();
  };

  return texture;
}

/**
 * Photorealistic Volumetric WebGL Cloud Layer:
 * - At first: The entire screen is 100% blanketed in dense, seamless real clouds (p = 0.18 -> 0.40).
 * - Parting: Genuine volumetric clouds billow and roll organically to the left and right sides (p = 0.40 -> 0.74).
 * - Zero sliding rectangular images, zero vertical seams, zero artificial ellipses.
 * - Golden sunlight scattering along the parting crests as the highway and truck are revealed.
 */
export const AtmosphericCloudLayer: React.FC<AtmosphericCloudLayerProps> = ({ progress: p }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texCloudRef = useRef<WebGLTexture | null>(null);
  const texCloudMobileRef = useRef<WebGLTexture | null>(null);
  const texWispRef = useRef<WebGLTexture | null>(null);
  const startTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  // Initialize WebGL context and shaders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
    });
    if (!gl) return;
    glRef.current = gl;

    const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return;

    const program = createProgram(gl, vs, fs);
    if (!program) return;
    programRef.current = program;

    // Full screen quad geometry
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const aPosition = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Load textures
    texCloudRef.current = loadTexture(gl, "/clouds/cloud_blanket.jpg");
    texCloudMobileRef.current = loadTexture(gl, "/clouds/cloud_blanket_mobile.jpg");
    texWispRef.current = loadTexture(gl, "/clouds/cloud_puff_1.png");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return () => {
      if (gl) {
        if (quadBuffer) gl.deleteBuffer(quadBuffer);
        if (program) gl.deleteProgram(program);
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
      }
    };
  }, []);

  // Frame render triggered by progress updates with continuous living atmospheric drift
  useEffect(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    const program = programRef.current;
    if (!gl || !canvas || !program) return;

    if (p < 0.17 || p > 0.78) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Render at optimized resolution for ultra-smooth 60fps
      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5);
      const w = typeof window !== "undefined" ? window.innerWidth : 1600;
      const h = typeof window !== "undefined" ? window.innerHeight : 900;

      const targetW = Math.round(w * dpr);
      const targetH = Math.round(h * dpr);

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        gl.viewport(0, 0, targetW, targetH);
      }

      // Progress calculations: on one scroll the clouds get to the sides
      const enterP = smoothstep(0.12, 0.22, p);
      const partP = smoothstep(0.24, 0.46, p);
      const fadeOut = 1 - smoothstep(0.42, 0.52, p);
      const masterOpacity = enterP * fadeOut;

      if (masterOpacity <= 0.002) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        return;
      }

      gl.useProgram(program);

      // Uniforms
      const uRes = gl.getUniformLocation(program, "u_resolution");
      const uTime = gl.getUniformLocation(program, "u_time");
      const uProg = gl.getUniformLocation(program, "u_progress");
      const uPart = gl.getUniformLocation(program, "u_part");
      const uOpac = gl.getUniformLocation(program, "u_opacity");
      const uIsMobile = gl.getUniformLocation(program, "u_isMobile");
      const uCloudTex = gl.getUniformLocation(program, "u_cloudTex");
      const uCloudMobileTex = gl.getUniformLocation(program, "u_cloudMobileTex");
      const uWispTex = gl.getUniformLocation(program, "u_wispTex");

      const isMobile = targetW < targetH || (typeof window !== "undefined" && window.innerWidth < 768);

      gl.uniform2f(uRes, targetW, targetH);
      gl.uniform1f(uTime, (performance.now() - startTimeRef.current) * 0.001);
      gl.uniform1f(uProg, p);
      gl.uniform1f(uPart, partP);
      gl.uniform1f(uOpac, masterOpacity);
      gl.uniform1f(uIsMobile, isMobile ? 1.0 : 0.0);

      // Bind textures
      if (texCloudRef.current) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texCloudRef.current);
        gl.uniform1i(uCloudTex, 0);
      }
      if (texCloudMobileRef.current) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texCloudMobileRef.current);
        gl.uniform1i(uCloudMobileTex, 1);
      }
      if (texWispRef.current) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, texWispRef.current);
        gl.uniform1i(uWispTex, 2);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [p]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[25] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full block"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default AtmosphericCloudLayer;
