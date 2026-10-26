import { isClosedDbError, reportClosedDbQuery } from "./dbError";

/**
 * Chỉ khi dev: thay bộ theo dõi promise bị reject của React Native để lỗi
 * "Access to closed resource" (truy vấn còn dở khi reload/Fast Refresh đóng DB)
 * chỉ in một dòng ngắn thay vì một ERROR đỏ kèm stack. Các rejection khác vẫn báo như cũ.
 *
 * Gọi lại enablePromiseRejectionTracker sẽ thay thế bộ theo dõi mặc định.
 */
type RejectionTracker = (options: {
  allRejections: boolean;
  onUnhandled: (id: number, rejection: unknown) => void;
  onHandled: (id: number) => void;
}) => void;

const tracker = (
  globalThis as { HermesInternal?: { enablePromiseRejectionTracker?: RejectionTracker } }
).HermesInternal?.enablePromiseRejectionTracker;

if (__DEV__ && tracker) {
  tracker({
    allRejections: true,
    onUnhandled: (id, rejection) => {
      if (isClosedDbError(rejection)) {
        reportClosedDbQuery(`promise #${id}`);
        return;
      }
      console.error(`Uncaught (in promise, id: ${id})`, rejection);
    },
    onHandled: (id) => {
      console.warn(`Promise rejection handled (id: ${id})`);
    },
  });
}
