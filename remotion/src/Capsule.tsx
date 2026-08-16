import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "800"],
  subsets: ["latin"],
});

export const NAVY = "#0E1E45";
export const NAVY_SOFT = "#17306B";
export const AMBER = "#F5A623";
export const CREAM = "#F6F3EC";

export type Step = { title: string; detail: string };
export type CapsuleProps = {
  title: string;
  subtitle: string;
  steps: Step[];
  accent?: string;
};

const INTRO = 75;
const STEP_LEN = 90;
const OUTRO = 90;

export const capsuleDuration = (steps: number) =>
  INTRO + steps * STEP_LEN + OUTRO;

const Backdrop: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 40;
  const drift2 = Math.cos(frame / 80) * 60;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(140deg, ${NAVY} 0%, ${NAVY_SOFT} 60%, ${NAVY} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: accent,
          opacity: 0.16,
          filter: "blur(120px)",
          left: -200 + drift,
          top: -250 + drift2,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "#3BE38B",
          opacity: 0.12,
          filter: "blur(140px)",
          right: -150 - drift,
          bottom: -200 - drift2,
        }}
      />
    </AbsoluteFill>
  );
};

const Intro: React.FC<{ title: string; subtitle: string; accent: string }> = ({
  title,
  subtitle,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 18, stiffness: 120 } });
  const y = interpolate(s, [0, 1], [70, 0]);
  const sub = spring({ frame: frame - 14, fps, config: { damping: 200 } });
  const bar = interpolate(frame, [8, 42], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{ justifyContent: "center", paddingLeft: 140, paddingRight: 200 }}
    >
      <div style={{ opacity: s, transform: `translateY(${y}px)` }}>
        <div
          style={{
            fontFamily,
            fontWeight: 600,
            letterSpacing: 8,
            fontSize: 26,
            color: accent,
            marginBottom: 22,
          }}
        >
          SCOLY · CAPSULE VIDÉO
        </div>
        <div
          style={{
            fontFamily,
            fontWeight: 800,
            fontSize: 96,
            lineHeight: 1.03,
            color: CREAM,
            maxWidth: 1300,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          height: 8,
          width: 420 * bar,
          background: accent,
          borderRadius: 8,
          margin: "36px 0 30px",
        }}
      />
      <div
        style={{
          fontFamily,
          fontWeight: 400,
          fontSize: 36,
          color: "rgba(246,243,236,0.75)",
          opacity: sub,
          maxWidth: 1100,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

const StepScene: React.FC<{
  step: Step;
  index: number;
  total: number;
  accent: string;
}> = ({ step, index, total, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const card = spring({ frame, fps, config: { damping: 20, stiffness: 140 } });
  const num = spring({ frame: frame - 6, fps, config: { damping: 9 } });
  const text = spring({ frame: frame - 18, fps, config: { damping: 200 } });
  const float = Math.sin(frame / 28) * 6;
  const progress = interpolate(frame, [0, STEP_LEN], [0, 1]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 130px" }}>
      <div
        style={{
          transform: `translateY(${interpolate(card, [0, 1], [90, float])}px)`,
          opacity: card,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 34,
          padding: "58px 66px",
          display: "flex",
          gap: 52,
          alignItems: "flex-start",
          maxWidth: 1500,
        }}
      >
        <div
          style={{
            transform: `scale(${num})`,
            minWidth: 132,
            height: 132,
            borderRadius: 30,
            background: accent,
            color: NAVY,
            fontFamily,
            fontWeight: 800,
            fontSize: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {index + 1}
        </div>
        <div style={{ opacity: text }}>
          <div
            style={{
              fontFamily,
              fontWeight: 800,
              fontSize: 62,
              color: CREAM,
              lineHeight: 1.1,
              marginBottom: 18,
            }}
          >
            {step.title}
          </div>
          <div
            style={{
              fontFamily,
              fontWeight: 400,
              fontSize: 34,
              color: "rgba(246,243,236,0.78)",
              lineHeight: 1.4,
              maxWidth: 1050,
            }}
          >
            {step.detail}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 130,
          right: 130,
          bottom: 90,
          display: "flex",
          gap: 12,
        }}
      >
        {new Array(total).fill(0).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 6,
              background:
                i < index
                  ? accent
                  : i === index
                    ? `linear-gradient(90deg, ${accent} ${progress * 100}%, rgba(255,255,255,0.15) ${progress * 100}%)`
                    : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const line = interpolate(frame, [18, 55], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", gap: 26 }}
    >
      <div
        style={{
          transform: `scale(${interpolate(s, [0, 1], [0.85, 1])})`,
          opacity: s,
          fontFamily,
          fontWeight: 800,
          fontSize: 108,
          color: CREAM,
        }}
      >
        SCOLY
      </div>
      <div
        style={{
          height: 6,
          width: 380 * line,
          background: accent,
          borderRadius: 6,
        }}
      />
      <div
        style={{
          fontFamily,
          fontSize: 34,
          color: "rgba(246,243,236,0.7)",
          opacity: line,
        }}
      >
        Tout pour la rentrée, en quelques clics.
      </div>
    </AbsoluteFill>
  );
};

export const Capsule: React.FC<CapsuleProps> = ({
  title,
  subtitle,
  steps,
  accent = AMBER,
}) => {
  return (
    <AbsoluteFill>
      <Backdrop accent={accent} />
      <Sequence durationInFrames={INTRO}>
        <Intro title={title} subtitle={subtitle} accent={accent} />
      </Sequence>
      {steps.map((step, i) => (
        <Sequence
          key={i}
          from={INTRO + i * STEP_LEN}
          durationInFrames={STEP_LEN}
        >
          <StepScene
            step={step}
            index={i}
            total={steps.length}
            accent={accent}
          />
        </Sequence>
      ))}
      <Sequence from={INTRO + steps.length * STEP_LEN} durationInFrames={OUTRO}>
        <Outro accent={accent} />
      </Sequence>
    </AbsoluteFill>
  );
};
