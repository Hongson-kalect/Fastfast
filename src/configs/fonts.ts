export type FontFamily = keyof typeof fonts;

export const fonts = {
  SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  // MulishThin: require("@/assets/fonts/Mulish/Mulish-Thin.ttf"),
  // MulishThinItalic: require("@/assets/fonts/Mulish/Mulish-ThinItalic.ttf"),
  MulishSemiBold: require("@/assets/fonts/Mulish/Mulish-SemiBold.ttf"),
  MulishSemiBoldItalic: require("@/assets/fonts/Mulish/Mulish-SemiBoldItalic.ttf"),
  MulishRegular: require("@/assets/fonts/Mulish/Mulish-Regular.ttf"),
  MulishRegularItalic: require("@/assets/fonts/Mulish/Mulish-Italic.ttf"),
  MulishMedium: require("@/assets/fonts/Mulish/Mulish-Medium.ttf"),
  MulishMediumItalic: require("@/assets/fonts/Mulish/Mulish-MediumItalic.ttf"),
  MulishLight: require("@/assets/fonts/Mulish/Mulish-Light.ttf"),
  MulishLightItalic: require("@/assets/fonts/Mulish/Mulish-LightItalic.ttf"),
  MulishExtraLight: require("@/assets/fonts/Mulish/Mulish-ExtraLight.ttf"),
  MulishExtraLightItalic: require("@/assets/fonts/Mulish/Mulish-ExtraLightItalic.ttf"),
  MulishExtraBold: require("@/assets/fonts/Mulish/Mulish-ExtraBold.ttf"),
  MulishExtraBoldItalic: require("@/assets/fonts/Mulish/Mulish-ExtraBoldItalic.ttf"),
  MulishBold: require("@/assets/fonts/Mulish/Mulish-Bold.ttf"),
  MulishBoldItalic: require("@/assets/fonts/Mulish/Mulish-BoldItalic.ttf"),
  MulishBlack: require("@/assets/fonts/Mulish/Mulish-Black.ttf"),
  MulishBlackItalic: require("@/assets/fonts/Mulish/Mulish-BlackItalic.ttf"),
};
// export const fonts = {
//   SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
//   PoppinsThin: require("@/assets/fonts/Poppins/Poppins-Thin.ttf"),
//   PoppinsThinItalic: require("@/assets/fonts/Poppins/Poppins-ThinItalic.ttf"),
//   PoppinsSemiBold: require("@/assets/fonts/Poppins/Poppins-SemiBold.ttf"),
//   PoppinsSemiBoldItalic: require("@/assets/fonts/Poppins/Poppins-SemiBoldItalic.ttf"),
//   PoppinsRegular: require("@/assets/fonts/Poppins/Poppins-Regular.ttf"),
//   PoppinsRegularItalic: require("@/assets/fonts/Poppins/Poppins-Italic.ttf"),
//   PoppinsMedium: require("@/assets/fonts/Poppins/Poppins-Medium.ttf"),
//   PoppinsMediumItalic: require("@/assets/fonts/Poppins/Poppins-MediumItalic.ttf"),
//   PoppinsLight: require("@/assets/fonts/Poppins/Poppins-Light.ttf"),
//   PoppinsLightItalic: require("@/assets/fonts/Poppins/Poppins-LightItalic.ttf"),
//   PoppinsExtraLight: require("@/assets/fonts/Poppins/Poppins-ExtraLight.ttf"),
//   PoppinsExtraLightItalic: require("@/assets/fonts/Poppins/Poppins-ExtraLightItalic.ttf"),
//   PoppinsExtraBold: require("@/assets/fonts/Poppins/Poppins-ExtraBold.ttf"),
//   PoppinsExtraBoldItalic: require("@/assets/fonts/Poppins/Poppins-ExtraBoldItalic.ttf"),
//   PoppinsBold: require("@/assets/fonts/Poppins/Poppins-Bold.ttf"),
//   PoppinsBoldItalic: require("@/assets/fonts/Poppins/Poppins-BoldItalic.ttf"),
//   PoppinsBlack: require("@/assets/fonts/Poppins/Poppins-Black.ttf"),
//   PoppinsBlackItalic: require("@/assets/fonts/Poppins/Poppins-BlackItalic.ttf"),
// };

export const fontFamily = Object.fromEntries(
  Object.keys(fonts).map((key) => [key, key]),
) as Record<keyof typeof fonts, keyof typeof fonts>;
