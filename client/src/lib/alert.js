import Swal from "sweetalert2";

export const alert = {
  error(message = "Something went wrong") {
    return Swal.fire({ icon: "error", title: "Error", text: message });
  },
  success(message = "Success") {
    return Swal.fire({ icon: "success", title: "Success", text: message });
  },
  info(message = "") {
    return Swal.fire({ icon: "info", title: "Info", text: message });
  },
  confirm({
    title = "Are you sure?",
    text = "",
    confirmText = "Yes",
    cancelText = "Cancel",
  } = {}) {
    return Swal.fire({
      icon: "warning",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
    });
  },
  toast(message = "Done", icon = "success") {
    return Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
      icon,
      title: message,
    });
  },
};
