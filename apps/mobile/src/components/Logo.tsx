import Svg, { Path } from "react-native-svg";

export function Logo({ size = 64, color = "#0f1623" }: { size?: number; color?: string }) {
  return (
    <Svg height={size} width={size} viewBox="0 0 1086 1116" fill="none">
      <Path
        d="M18 930V652c0-14 8-24 30-37l194-113c8-5 9-2 9 8v113c0 6-3 10-9 14l-108 63c-8 5-12 10-12 20v161c0 10 4 15 12 20l108 63c6 4 9 8 9 14v113c0 10-1 13-9 8L48 986c-22-13-30-23-30-56Zm232-281 179-105c9-5 14-4 22 1l179 105c8 5 11 10 11 20v206c0 10-3 15-11 20l-179 105c-8 5-13 6-22 1L250 895c-8-5-11-10-11-20V669c0-10 3-15 11-20Z"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  );
}
