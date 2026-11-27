export const statuses = [
  {value: 'new', label: 'Новая'},
  {value: 'confirmed', label: 'Подтверждена'},
  {value: 'active', label: 'В работе'},
  {value: 'completed', label: 'Завершена'},
  {value: 'cancelled', label: 'Отменена'}
]

export function statusLabel(value) {
  return statuses.find(status => status.value === value)?.label || value
}

export const transitions = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['completed'],
  completed: [],
  cancelled: []
}