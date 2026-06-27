// app/api/belanja/route.ts

function calculateBelanja(data: {
  jumlah?: number
  total?: number
  hppPerPorsi: number
}) {
  const { jumlah, total, hppPerPorsi } = data
  
  // Validasi: minimal salah satu diisi
  if (!jumlah && !total) {
    throw new Error('Isi salah satu: Jumlah atau Total')
  }
  
  // Skenario 1: User isi jumlah saja
  if (jumlah && !total) {
    return {
      jumlah,
      total: null,
      jumlahSystem: null,
      totalSystem: jumlah * hppPerPorsi,  // system total
    }
  }
  
  // Skenario 2: User isi total saja
  if (total && !jumlah) {
    return {
      jumlah: null,
      total,
      jumlahSystem: Math.floor(total / hppPerPorsi),  // system jumlah
      totalSystem: null,
    }
  }
  
  // Skenario 3: User isi keduanya
  if (jumlah && total) {
    return {
      jumlah,
      total,
      jumlahSystem: null,
      totalSystem: null,
    }
  }
  
  // Skenario 4: Keduanya null (sudah dihandle di validasi)
  return null
}