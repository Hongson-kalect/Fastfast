// hooks/useNavigationService.ts
import { Href, UnknownInputParams, useRouter } from "expo-router";

type Path = Href;
export const useAppNavigation = () => {
  const router = useRouter();

  const routerPush = (path: Path, params?: UnknownInputParams) => {
    console.log("Navigating to:", path);
    // Gửi data đến analytics service nếu cần
    router.push({ pathname: path, params });
  };

  const routerReplace = (path: Path) => {
    router.replace(path);
  };

  const routerBack = () => {
    router.back();
  };

  return {
    routerPush,
    routerReplace,
    routerBack,
  };
};
