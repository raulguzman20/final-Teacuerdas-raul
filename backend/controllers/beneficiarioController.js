const Beneficiario = require('../models/Beneficiario');

// GET - Get all beneficiaries
exports.getBeneficiarios = async (req, res) => {
  try {
    const searchQuery = req.query.search || ''

    // Construir consulta básica por término (nombre, apellido, documento)
    const query = searchQuery
      ? {
          $or: [
            { nombre: { $regex: searchQuery, $options: 'i' } },
            { apellido: { $regex: searchQuery, $options: 'i' } },
            { numero_de_documento: { $regex: searchQuery, $options: 'i' } },
          ],
        }
      : {}

    // Obtener desde la colección Beneficiario
    const beneficiarios = await Beneficiario.find(query)

    // Aplicar normas de filtrado en backend:
    // 1) Es beneficiario si clienteId === _id (cliente-beneficiario)
    // 2) También se reconoce como beneficiario si clienteId !== _id (beneficiario dependiente)
    // 3) Excluir registros que son solo clientes (clienteId === 'cliente')
    const filtrados = beneficiarios.filter((b) => {
      const clienteIdStr = String(b.clienteId || '').toLowerCase()
      const selfIdStr = String(b._id || '').toLowerCase()
      const esBeneficiario =
        clienteIdStr === selfIdStr || (clienteIdStr && clienteIdStr !== 'cliente' && clienteIdStr !== selfIdStr)
      return esBeneficiario
    })

    res.json(filtrados)
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET - Get beneficiary by ID
exports.getBeneficiarioById = async (req, res) => {
  try {
    const beneficiario = await Beneficiario.findById(req.params.id);
    if (beneficiario) {
      res.json(beneficiario);
    } else {
      res.status(404).json({ message: 'Beneficiario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST - Create a new beneficiary
exports.createBeneficiario = async (req, res) => {
  const beneficiario = new Beneficiario(req.body);
  try {
    const newBeneficiario = await beneficiario.save();
    res.status(201).json(newBeneficiario);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT - Update a beneficiary
exports.updateBeneficiario = async (req, res) => {
  try {
    const beneficiario = await Beneficiario.findById(req.params.id);
    if (beneficiario) {
      Object.assign(beneficiario, req.body);
      const updatedBeneficiario = await beneficiario.save();
      res.json(updatedBeneficiario);
    } else {
      res.status(404).json({ message: 'Beneficiario no encontrado' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE - Delete a beneficiary
exports.deleteBeneficiario = async (req, res) => {
  try {
    const beneficiario = await Beneficiario.findById(req.params.id);
    if (!beneficiario) {
      return res.status(404).json({ message: 'Beneficiario no encontrado' });
    }

    // Verificar si el beneficiario está asociado a alguna venta
    const Venta = require('../models/Venta');
    const ventasAsociadas = await Venta.findOne({ beneficiarioId: beneficiario._id });
    
    if (ventasAsociadas) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el beneficiario porque está asociado a una venta de curso o matrícula' 
      });
    }

    await Beneficiario.deleteOne({ _id: beneficiario._id });
    res.json({ message: 'Beneficiario eliminado' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};