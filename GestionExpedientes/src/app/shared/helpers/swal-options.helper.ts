// swal-options.helper.ts

export function getSwalOptions(tipo: 'success' | 'error' | 'warning' | 'question' = 'success') {
  const baseOptions: any = {
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    showCancelButton: false,
    background: '#f4fdfc', // fondo predeterminado suave
    color: '#333333', // texto general
    customClass: {
      popup: 'rounded-xl shadow-md',
      confirmButton: 'swal2-confirm-button',
      cancelButton: 'swal2-cancel-button',
      title: 'text-xl font-semibold',
      htmlContainer: 'text-base'
    }
  };

  switch (tipo) {
    case 'error':
      return {
        ...baseOptions,
        icon: 'error',
        confirmButtonColor: '#F36C21',
        cancelButtonColor: '#E5E7EB',
        background: '#fff8f2',
        iconColor: '#F36C21'
      };
    case 'warning':
      return {
        ...baseOptions,
        icon: 'warning',
        confirmButtonColor: '#F36C21',
        cancelButtonColor: '#E5E7EB',
        background: '#fff8f2',
        iconColor: '#F36C21'
      };
    case 'question':
      return {
        ...baseOptions,
        icon: 'question',
        confirmButtonColor: '#004C77',
        cancelButtonColor: '#E5E7EB',
        background: '#f4fdfc',
        iconColor: '#004C77',
        showCancelButton: true
      };
    default: // success
      return {
        ...baseOptions,
        icon: 'success',
        confirmButtonColor: '#004C77',
        cancelButtonColor: '#E5E7EB',
        background: '#f4fdfc',
        iconColor: '#004C77'
      };
  }
}
