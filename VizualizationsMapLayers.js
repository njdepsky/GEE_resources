///--------------------------- Map Layer Visualizations ---------------------------------///
exports.modis_true = {
    bands: ['Nadir_Reflectance_Band1', 'Nadir_Reflectance_Band4', 'Nadir_Reflectance_Band3'],
    min: 0,
    max: 3000,
    gamma: [0.95, 1.1, 1]
};

exports.modis_f1 = {
    bands: ['Nadir_Reflectance_Band2', 'Nadir_Reflectance_Band1', 'Nadir_Reflectance_Band4'],
    min: 0,
    max: 4000,
    gamma: [0.95, 1.1, 1]
};

exports.modis_f2 = {
    bands: ['Nadir_Reflectance_Band6', 'Nadir_Reflectance_Band2', 'Nadir_Reflectance_Band1'],
    min: 0,
    max: 4000,
    gamma: [0.95, 1.1, 1]
};

exports.modis09_true = {
    bands: ['sur_refl_b01', 'sur_refl_b04', 'sur_refl_b03'],
    min: 0,
    max: 3000,
    gamma: [0.95, 1.1, 1]
};

exports.modis09_f1 = {
    bands: ['sur_refl_b02', 'sur_refl_b01', 'sur_refl_b04'],
    min: 0,
    max: 4000,
    gamma: [0.95, 1.1, 1]
};

exports.modis09_f2 = {
    bands: ['sur_refl_b06', 'sur_refl_b02', 'sur_refl_b01'],
    min: 0,
    max: 4000,
    gamma: [0.95, 1.1, 1]
};

// True Color for Landsat 4-7 - SR Tier 1 
exports.ls_true = {
    bands: ['B3', 'B2', 'B1'],
    min: 0,
    max: 4000
};

// False Color 1 (Red Veg) for Landsat 4-7 - SR Tier 1 
exports.ls_f1 = {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 5000
};

// False Color 2 (Green Veg) for Landsat 4-7 - SR Tier 1 
exports.ls_f2 = {
    bands: ['B5', 'B4', 'B3'],
    min: 0,
    max: 5000
};

// True Color for Landsat 4-7 - TOA (Orthorectified)
exports.lsTOA_true = {
    bands: ['B3', 'B2', 'B1'],
    min: 0,
    max: 0.5
};

// False Color 1 (Red Veg) for Landsat 4-7 - TOA (Orthorectified)
exports.lsTOA_f1 = {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 0.5
};

// False Color 2 (Green Veg) for Landsat 4-7 - TOA (Orthorectified)
exports.lsTOA_f2 = {
    bands: ['B5', 'B4', 'B3'],
    min: 0,
    max: 0.5
};

// True Color for any Landsat 8 SR collection
exports.ls8_true = {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 5000
};

// False Color 1 (Red Veg) for any Landsat 8 SR collection
exports.ls8_f1 = {
    bands: ['B5', 'B4', 'B3'],
    min: 0,
    max: 5000
};

// False Color 2 (Green Veg) for any Landsat 8 SR collection
exports.ls8_f2 = {
    bands: ['B6', 'B5', 'B4'],
    min: 0,
    max: 5000
};

// True Color for any Landsat 8 TOA collection
exports.ls8TOA_true = {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 0.5
};

// False Color 1 (Red Veg) for any Landsat 8 TOA collection
exports.ls8TOA_f1 = {
    bands: ['B5', 'B4', 'B3'],
    min: 0,
    max: 0.5
};

// False Color 2 (Green Veg) for any Landsat 8 TOA collection
exports.ls8TOA_f2 = {
    bands: ['B6', 'B5', 'B4'],
    min: 0,
    max: 0.5
};

exports.s1 = {
    min: [-30, -30, 0], 
    max: [0, 0, 90]
}

exports.s2_true = {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 4000
}

exports.s2_f1 = {
    bands: ['B8', 'B4', 'B3'],
    min: 0,
    max: 4000
}

exports.s2_f2 = {
    bands: ['B11', 'B8', 'B4'],
    min: 0,
    max: 4000
}

exports.water = {
    min: 0,
    max: 1,
    palette: '0291f7'
};

exports.water2 = {
    min: 0,
    max: 1,
    palette: '01e2f7'
};

exports.col1 = {color: '35ffc9'};

exports.prmm = {
    min: 0,
    max: 10,
    palette: ['white','blue']
};

exports.tas = {
    min: 270,
    max: 320,
    palette: ['blue','orange','red']
};

// Color Palette for display
exports.ndvi = {
  min: -1.0, 
  max: 1.0, 
  palette: ['blue', 'white', 'green']
}
///----------------------------------------------------------------------------------///