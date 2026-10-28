import i18n from "i18next";
import { ThemedText } from "@/components/themed-text";
import {
  BasicModalOptions,
  CheckboxModalOptions,
  RadioModalOptions,
  SelectOption,
  SelectValue,
} from "@/providers/Modal";
import { useAppStore } from "@/stores/appStore";
import useModalStore from "@/stores/modalStore";
import { getContrastTextColor } from "@/utils/color";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";

/** Một dòng lựa chọn, dùng chung cho radio và checkbox. */
const OptionRow = ({
  option,
  selected,
  shape,
  onPress,
}: {
  option: SelectOption;
  selected: boolean;
  shape: "radio" | "checkbox";
  onPress: () => void;
}) => {
  const theme = useAppStore((state) => state.theme);
  const isRadio = shape === "radio";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        backgroundColor: selected ? theme.primary + "14" : theme.text + "08",
      }}
    >
      {option.icon}

      <View className="flex-1">
        <ThemedText
          size="sm"
          weight={selected ? "semibold" : "medium"}
          color={selected ? "primary" : "text"}
          numberOfLines={2}
        >
          {option.label}
        </ThemedText>
        {option.description && (
          <ThemedText
            size="xxs"
            color="text"
            opacity="medium"
            className="mt-0.5"
          >
            {option.description}
          </ThemedText>
        )}
      </View>

      {/* Chỉ báo: tròn cho radio, vuông bo góc cho checkbox */}
      <View
        className={`h-5 w-5 items-center justify-center ${isRadio ? "rounded-full" : "rounded-md"}`}
        style={{
          borderWidth: selected ? 0 : 1.5,
          borderColor: theme.text + "40",
          backgroundColor: selected ? theme.primary : "transparent",
        }}
      >
        {selected &&
          (isRadio ? (
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getContrastTextColor(theme.primary) }}
            />
          ) : (
            <Feather
              name="check"
              size={13}
              color={getContrastTextColor(theme.primary)}
            />
          ))}
      </View>
    </TouchableOpacity>
  );
};

const Header = ({ title, message }: { title?: string; message?: string }) => (
  <>
    {title && (
      <ThemedText size="xl" weight="bold" color="title">
        {title}
      </ThemedText>
    )}
    {message && (
      <ThemedText
        size="sm"
        color="text"
        opacity="medium"
        className="mt-1"
        style={{ lineHeight: 21 }}
      >
        {message}
      </ThemedText>
    )}
  </>
);

/** Chọn một: bấm là chọn và đóng luôn. */
export const RadioModal = (modal: RadioModalOptions & BasicModalOptions) => {
  const closeCurrentModal = useModalStore((state) => state.closeCurrentModal);

  const select = (value: SelectValue) => {
    if (value !== modal.value) modal.onSelect(value);
    closeCurrentModal();
  };

  return (
    <View className="px-1 pb-1">
      <Header title={modal.title} message={modal.message} />

      <ScrollView
        className="mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {modal.options.map((option) => (
          <OptionRow
            key={String(option.value)}
            option={option}
            shape="radio"
            selected={option.value === modal.value}
            onPress={() => select(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

/** Chọn nhiều: đánh dấu xong bấm nút xác nhận. */
export const CheckboxModal = (
  modal: CheckboxModalOptions & BasicModalOptions,
) => {
  const closeCurrentModal = useModalStore((state) => state.closeCurrentModal);
  const theme = useAppStore((state) => state.theme);
  const [values, setValues] = useState<SelectValue[]>(modal.values ?? []);

  // Provider giữ nguyên instance giữa các modal cùng loại → nạp lại khi mở modal mới
  useEffect(() => {
    setValues(modal.values ?? []);
  }, [modal.values, modal.options]);

  const min = modal.min ?? 0;
  const max = modal.max ?? Infinity;
  const canConfirm = values.length >= min;

  // Đã đủ `max` thì không đánh dấu thêm, phải bỏ bớt trước
  const toggle = (value: SelectValue) =>
    setValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : current.length >= max
          ? current
          : [...current, value],
    );

  const cancel = () => {
    modal.onCancel?.();
    closeCurrentModal();
  };

  const confirm = () => {
    if (!canConfirm) return;
    modal.onConfirm(values);
    closeCurrentModal();
  };

  return (
    <View className="px-1 pb-1">
      <Header title={modal.title} message={modal.message} />

      {max !== Infinity && (
        <ThemedText size="xs" color="text" opacity="low" className="mt-1">
          {i18n.t("settings.selectedCount", { count: values.length, max })}
        </ThemedText>
      )}

      <ScrollView
        className="mt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {modal.options.map((option) => (
          <OptionRow
            key={String(option.value)}
            option={option}
            shape="checkbox"
            selected={values.includes(option.value)}
            onPress={() => toggle(option.value)}
          />
        ))}
      </ScrollView>

      <View className="mt-6 flex-row gap-2.5">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={cancel}
          className="h-12 flex-1 items-center justify-center rounded-full bg-text-base/10"
        >
          <ThemedText size="sm" weight="semibold" color="text" opacity="medium">
            {modal.cancelText || i18n.t("common.cancel")}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!canConfirm}
          onPress={confirm}
          className="h-12 flex-1 items-center justify-center rounded-full"
          style={{
            backgroundColor: theme.primary,
            opacity: canConfirm ? 1 : 0.4,
          }}
        >
          <ThemedText
            size="sm"
            weight="semibold"
            colorHex={getContrastTextColor(theme.primary)}
          >
            {modal.okText || i18n.t("common.ok")}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};
