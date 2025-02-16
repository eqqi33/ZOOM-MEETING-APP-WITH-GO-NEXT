type AlertProps = {
  status?: 'danger' | 'error' | 'success'
  children: React.ReactNode
}

const Alert = ({ status = 'danger', children }: AlertProps) => {
  const bgColor = {
    danger: 'bg-red-500',
    error: 'bg-orange-500',
    success: 'bg-green-500',
  }[status]

  return <div className={`p-2 rounded ${bgColor}`}>{children}</div>
}

export { Alert }