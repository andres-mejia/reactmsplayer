export default function typeBuilder(types) {
  const data = {}

  types.map((type) => {
    data[type] = type
  })

  return data
}
