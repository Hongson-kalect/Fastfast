

export const fonts = {
  SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
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

export const fontFamily = Object.fromEntries(
  Object.keys(fonts).map((key) => [key, key]),
) as Record<keyof typeof fonts, keyof typeof fonts>;
