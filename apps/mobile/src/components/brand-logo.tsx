import { SvgXml } from "react-native-svg";
import { useAppearance } from "../store/theme";
import { logoXml, iconXml } from "./brand-assets";
export function BrandLogo({
  width = 190,
  icon = false,
}: {
  width?: number;
  icon?: boolean;
}) {
  const { mode } = useAppearance();
  const xml = icon
    ? iconXml
    : logoXml.replaceAll("#545454", mode === "dark" ? "#f2f4fa" : "#545454");
  return (
    <SvgXml
      xml={xml}
      width={width}
      height={icon ? width : (width * 77) / 276}
      accessibilityRole="image"
      accessibilityLabel="Nexum"
    />
  );
}
