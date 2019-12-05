///------------------------------ Useful Functions -------------------------------------------------------------------------///

//------------------------------- Image Date Functions --------------------------------------------------------------------///
// List of days with at least one tile in an image collection for a given ROI, is slow because it loops through all possible days in the time period and check to see if the imgcol has any tiles for that day.  It is quick to iteratively extract/sort the dates directly from the imgcol metadata (e.g. 'DATE_ACQUIRED'), but I'm not sure how to reduce this list of tiles to a unique day list. Also, not all imagery datasets have a straightforward date field (e.g. Sentinel dates are stored in a long complicated coded string) 
exports.dayList = function(imgcol, start, finish){
  var day_diff = finish.difference(start, 'day');
  var days = ee.List.sequence(0, day_diff.subtract(1)).map(function(day){return start.advance(day,'day')});
  var iter_func = function(date, newlist){
      var day = ee.Date(date);
      newlist = ee.List(newlist);
      var filtered = imgcol.filterDate(day, day.advance(1,'day'));
      return ee.List(ee.Algorithms.If(filtered.size(), newlist.add(day), newlist));
  };
  return ee.List(days.iterate(iter_func, ee.List([])));
};

// List all months with at least one tile in an image collection (GETTING DEPRECATED)
exports.monList = function(imgcol, start, finish){
  //Months
  var mon_diff = finish.difference(start, 'month');
  var months = ee.List.sequence(0, mon_diff.subtract(1)).map(function(month){return start.advance(month,'month')});
  var iter_func = function(date, newlist){
      date = ee.Date(date);
      newlist = ee.List(newlist);
      var filtered = imgcol.filterDate(date, date.advance(1,'month'));
      return ee.List(ee.Algorithms.If(filtered.size(), newlist.add(date), newlist));
  };
  return ee.List(months.iterate(iter_func, ee.List([])));
};

//Day mosaic collection function, with large ROIs, date ranges, high res images, this can often exceed the memory limit
//var days = dayList(imgcol, start, finish);
// exports.dayMosaic = function(imgcol, days){
//   var iter_func = function(date, newlist){
//       date = ee.Date(date);
//       newlist = ee.List(newlist);
//       var filtered = imgcol.filterDate(date, date.advance(1,'day'));
//       return ee.List(newlist.add(filtered.mosaic()));
//   };
//   return ee.ImageCollection(ee.List(days.iterate(iter_func, ee.List([]))));
// };

// Month Median mosaic collection function
exports.monMedMosaic1 = function(imgcol, start, finish){
  var monsList = function(imgcol, start, finish){
    //Months
    var mon_diff = finish.difference(start, 'month');
    var months = ee.List.sequence(0, mon_diff.subtract(1)).map(function(month){return start.advance(month,'month')});
    var iter_func = function(date, newlist){
        date = ee.Date(date);
        newlist = ee.List(newlist);
        var filtered = imgcol.filterDate(date, date.advance(1,'month'));
        return ee.List(ee.Algorithms.If(filtered.size(), newlist.add(date), newlist));
    };
    return ee.List(months.iterate(iter_func, ee.List([])));
  };
  var mons = monsList(imgcol, start, finish);
  var iter_func = function(date, newlist){
      date = ee.Date(date);
      newlist = ee.List(newlist);
      var filtered = ee.Image(imgcol.filterDate(date, date.advance(1,'month'))
                        .median()
                        .set('system:time_start', date));
      return ee.List(newlist.add(filtered));
  };
  return ee.ImageCollection(ee.List(mons.iterate(iter_func, ee.List([]))));
};

// Month Median mosaic collection function
exports.monMedMosaic = function(imgcol, startDate, endDate){
  var nMonths = ee.Number(endDate.difference(startDate,'month')).round().subtract(1);
  var outcol = ee.ImageCollection(
    // map over each month
    ee.List.sequence(0,nMonths).map(function (n) {
      // calculate the offset from startDate
      var ini = startDate.advance(n,'month');
      var imgdate = ee.Date(ini).format("YYYY-MM-dd");
      var systime = ee.Date(imgdate).millis();
      // advance just one month
      var end = ini.advance(1,'month');
      // filter and reduce
      return imgcol.filterDate(ini,end).median()
                        .set('Date', imgdate)
                        .set('system:index', imgdate)
                        .set('system:time_start', systime)
  }));
  return outcol.map(function(image) {
    return image.set('nBands', image.bandNames().length())
  }).filter(ee.Filter.gt('nBands', 0))
};

// Funtion for iteraton over the range of dates
exports.dayMosaic = function(imgcol, start, finish){
  var diff = finish.difference(start, 'day');
  var dates = ee.List.sequence(0, diff.subtract(1)).map(function(day){return start.advance(day,'day')});
  function iter_func(date, newlist){
      date = ee.Date(date);
      newlist = ee.List(newlist);
      var filtered = imgcol.filterDate(date, date.advance(1,'day'));
      var image = ee.Image(filtered.mosaic());
      image = image.set('Date',ee.Date(date).format("YYYY-MM-dd"));
      image = image.set('system:time_start',ee.Date(date).millis());
      return ee.List(ee.Algorithms.If(filtered.size(), newlist.add(image), newlist));
    }
    return ee.ImageCollection(ee.List(dates.iterate(iter_func, ee.List([]))));
};

// Unique Date (ymd) List with Image Count from Image Collection
exports.ymdList = function(imgcol){
  var iter_func = function(image, newlist){
      var date = ee.Number.parse(image.date().format("YYYYMMdd"));
      newlist = ee.List(newlist);
      return ee.List(newlist.add(date).sort())
  };
  imgcol = imgcol.iterate(iter_func, ee.List([]));
  return ee.List(imgcol).reduce(ee.Reducer.frequencyHistogram())
}
//-------------------------------------------------------------------------------------------------------------------------///

//------------------------------- Map Plotting Functions --------------------------------------------------------------------///
//plot first image of a collection
exports.plot1 = function(imgcol,viz,lab){
  return Map.addLayer(ee.Image(imgcol.first()),viz,lab);
};

//plot ith image
exports.ploti = function(imgcol,indexField,i,viz,lab){
  var imglist = imgcol.toList(imgcol.size());
  var ind = ee.Number(i).subtract(1);
  var img = ee.Image(imglist.get(ind));
  // return Map.addLayer(ee.Image(imgcol.filter(ee.Filter.eq(indexField, i)).first()),viz,lab);
  return Map.addLayer(img,viz,lab);
};

//plot day mosaic image
exports.plotDM = function(date,imgcol,viz,lab){
  return Map.addLayer(ee.Image(imgcol.filterDate(date, date.advance(1,'day')).mosaic()),viz,lab);
};

//plot image by property
exports.plotProp = function(imgcol,property,value,viz,lab){
  return Map.addLayer(ee.Image(imgcol.filter(ee.Filter.eq(property, value)).first()),viz,lab);
};

//plot image collection by single day filter (date = "YYYY-MM-dd" string)
exports.plotDay = function(imgcol,date,viz,lab){
date = ee.Date(date);
  return Map.addLayer(imgcol.filterDate(date, date.advance(1,'day')),viz,lab);
};

//plot image collection by single month filter (date = "YYYY-MM-01" string)
exports.plotMonth = function(imgcol,date,viz,lab){
  date = ee.Date(date);
    return Map.addLayer(imgcol.filterDate(date, date.advance(1,'month')),viz,lab);
  };

// Landsat 4,5,7 sr_cloud_qa mask plotting function - add map layers of all qa class types from the sr_cloud_qa band in Landsat 4,5,7 products
exports.ls457_sr_cloud_qaMap = function(image){
  var srcld_allMask = function(image){
    var cfmask = image.select('sr_cloud_qa');    
    return image.updateMask(cfmask.gte(1));  
  };
  
  var ddvMask = function(image){
    var cfmask = image.select('sr_cloud_qa');    
    return image.updateMask(cfmask.eq(1).or(cfmask.eq(9)));  
  };
  
  var cloudMask = function(image){
    var cfmask = image.select('sr_cloud_qa');    
    return image.updateMask(cfmask.eq(2).or(cfmask.eq(34)));  
  };
  
  var cshdwMask = function(image){
    var cfmask = image.select('sr_cloud_qa');    
    return image.updateMask(cfmask.eq(4).or(cfmask.eq(12)).or(cfmask.eq(20)).or(cfmask.eq(36)).or(cfmask.eq(52)));  
  };
  
  var adjclMask = function(image){
    var cfmask = image.select('sr_cloud_qa');    
    return image.updateMask(cfmask.eq(8).or(cfmask.eq(12)).or(cfmask.eq(24)).or(cfmask.eq(40)).or(cfmask.eq(56)));  
  };
  
  var snowMask = function(image){
    var cfmask = image.select('sr_cloud_qa');    
    return image.updateMask(cfmask.eq(16).or(cfmask.eq(20)).or(cfmask.eq(24)).or(cfmask.eq(48)).or(cfmask.eq(52)).or(cfmask.eq(56)));  
  };
  
  var waterMask = function(image){
    var cfmask = image.select('sr_cloud_qa');    
    return image.updateMask(cfmask.eq(32).or(cfmask.eq(34)).or(cfmask.eq(36)).or(cfmask.eq(40)).or(cfmask.eq(48)).or(cfmask.eq(52)).or(cfmask.eq(56)));
  };

  return (
    Map.addLayer(srcld_allMask(image).select('sr_cloud_qa'),{min:0,max:1,palette:'898989'},'sr_cloud_qa all'),
    Map.addLayer(ddvMask(image).select('sr_cloud_qa'),{palette:'green'},'sr_cloud_qa ddv'),
    Map.addLayer(cloudMask(image).select('sr_cloud_qa'),{palette:'11e7ff'},'sr_cloud_qa cloud'),
    Map.addLayer(cshdwMask(image).select('sr_cloud_qa'),{palette:'ffaf11'},'sr_cloud_qa cloud shdw'),
    Map.addLayer(adjclMask(image).select('sr_cloud_qa'),{palette:'f77300'},'sr_cloud_qa adjacent to cloud'),
    Map.addLayer(snowMask(image).select('sr_cloud_qa'),{palette:'c1fff6'},'sr_cloud_qa snow'),
    Map.addLayer(waterMask(image).select('sr_cloud_qa'),{palette:'ff3894'},'sr_cloud_qa water'))
}

// Landsat 4,5,7 pixel_qa mask plotting function - add map layers of all qa class types from the pixel_qa band in Landsat 4,5,7 products
exports.ls457_pixel_qaMap = function(image){
  var fillMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(1));  
  };
  
  var clearMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(66).or(cfmask.eq(130)));  
  };
  
  var waterMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(68).or(cfmask.eq(132)));  
  };
  
  var cshdwMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(72).or(cfmask.eq(136)));  
  };
  
  var snwicMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(80).or(cfmask.eq(112)).or(cfmask.eq(144)).or(cfmask.eq(176)));  
  };
  
  var cloudMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(96).or(cfmask.eq(112)).or(cfmask.eq(160)).or(cfmask.eq(176)).or(cfmask.eq(224)));  
  };
  
  var lwcldMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(66).or(cfmask.eq(68)).or(cfmask.eq(72)).or(cfmask.eq(80)).or(cfmask.eq(96)).or(cfmask.eq(112)));  
  };
  
  var mdcldMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(130).or(cfmask.eq(132)).or(cfmask.eq(136)).or(cfmask.eq(144)).or(cfmask.eq(160)).or(cfmask.eq(176)));  
  };
  
  var hicldMask2 = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(224));  
  };
  return (
    Map.addLayer(fillMask2(image).select('pixel_qa'),{palette:'green'},'pixel_qa fill'),
    Map.addLayer(clearMask2(image).select('pixel_qa'),{palette:'11e7ff'},'pixel_qa clear'),
    Map.addLayer(waterMask2(image).select('pixel_qa'),{palette:'ffaf11'},'pixel_qa water'),
    Map.addLayer(cshdwMask2(image).select('pixel_qa'),{palette:'f77300'},'pixel_qa cloud shadow'),
    Map.addLayer(snwicMask2(image).select('pixel_qa'),{palette:'c1fff6'},'pixel_qa snow/ice'),
    Map.addLayer(cloudMask2(image).select('pixel_qa'),{palette:'ff3894'},'pixel_qa cloud'),
    Map.addLayer(lwcldMask2(image).select('pixel_qa'),{palette:'f4ddff'},'pixel_qa low conf cloud'),
    Map.addLayer(mdcldMask2(image).select('pixel_qa'),{palette:'d074fc'},'pixel_qa med conf cloud'),
    Map.addLayer(hicldMask2(image).select('pixel_qa'),{palette:'ae00ff'},'pixel_qa high conf cloud'))
}

// Landsat 8 pixel_qa mask plotting function - add map layers of all qa class types from the pixel_qa band in Landsat 8
exports.ls8_pixel_qaMap = function(image){
  var fillMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(1));  
  };
  
  var clearMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(322).or(cfmask.eq(386)).or(cfmask.eq(834)).or(cfmask.eq(898)).or(cfmask.eq(1346)));  
  };
  
  var waterMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(324).or(cfmask.eq(388)).or(cfmask.eq(836)).or(cfmask.eq(900)).or(cfmask.eq(1348)));  
  };
  
  var cshdwMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(328).or(cfmask.eq(392)).or(cfmask.eq(840)).or(cfmask.eq(904)).or(cfmask.eq(1350)));  
  };
  
  var snwicMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(336).or(cfmask.eq(368)).or(cfmask.eq(400)).or(cfmask.eq(432)).or(cfmask.eq(848)).or(cfmask.eq(880)).or(cfmask.eq(912)).or(cfmask.eq(944)).or(cfmask.eq(1352)));  
  };
  
  var cloudMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(352).or(cfmask.eq(368)).or(cfmask.eq(416)).or(cfmask.eq(432)).or(cfmask.eq(480)).or(cfmask.eq(864)).or(cfmask.eq(880)).or(cfmask.eq(928)).or(cfmask.eq(944)).or(cfmask.eq(992)));  
  };
  
  var lwcldMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(322).or(cfmask.eq(324)).or(cfmask.eq(328)).or(cfmask.eq(336)).or(cfmask.eq(352)).or(cfmask.eq(368)).or(cfmask.eq(834)).or(cfmask.eq(836)).or(cfmask.eq(840)).or(cfmask.eq(848)).or(cfmask.eq(864)).or(cfmask.eq(880)));  
  };
  
  var mdcldMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(386).or(cfmask.eq(388)).or(cfmask.eq(392)).or(cfmask.eq(400)).or(cfmask.eq(416)).or(cfmask.eq(432)).or(cfmask.eq(898)).or(cfmask.eq(900)).or(cfmask.eq(904)).or(cfmask.eq(928)).or(cfmask.eq(944)));  
  };
  
  var hicldMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(480).or(cfmask.eq(992)));  
  };

  var lwcirrMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(322).or(cfmask.eq(324)).or(cfmask.eq(328)).or(cfmask.eq(336)).or(cfmask.eq(352)).or(cfmask.eq(368)).or(cfmask.eq(386)).or(cfmask.eq(388)).or(cfmask.eq(392)).or(cfmask.eq(400)).or(cfmask.eq(416)).or(cfmask.eq(432)).or(cfmask.eq(480)));  
  };

  var hicirrMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(834).or(cfmask.eq(836)).or(cfmask.eq(840)).or(cfmask.eq(848)).or(cfmask.eq(864)).or(cfmask.eq(880)).or(cfmask.eq(898)).or(cfmask.eq(900)).or(cfmask.eq(904)).or(cfmask.eq(912)).or(cfmask.eq(928)).or(cfmask.eq(944)).or(cfmask.eq(992)));  
  };

  var terrOccMask = function(image){
    var cfmask = image.select('pixel_qa');    
    return image.updateMask(cfmask.eq(1346).or(cfmask.eq(1348)).or(cfmask.eq(1350)).or(cfmask.eq(1352)));  
  };

  return (
    Map.addLayer(fillMask(image).select('pixel_qa'),{palette:'green'},'pixel_qa fill'),
    Map.addLayer(clearMask(image).select('pixel_qa'),{palette:'11e7ff'},'pixel_qa clear'),
    Map.addLayer(waterMask(image).select('pixel_qa'),{palette:'ffaf11'},'pixel_qa water'),
    Map.addLayer(cshdwMask(image).select('pixel_qa'),{palette:'f77300'},'pixel_qa cloud shadow'),
    Map.addLayer(snwicMask(image).select('pixel_qa'),{palette:'c1fff6'},'pixel_qa snow/ice'),
    Map.addLayer(cloudMask(image).select('pixel_qa'),{palette:'ff3894'},'pixel_qa cloud'),
    Map.addLayer(lwcldMask(image).select('pixel_qa'),{palette:'f4ddff'},'pixel_qa low conf cloud'),
    Map.addLayer(mdcldMask(image).select('pixel_qa'),{palette:'d074fc'},'pixel_qa med conf cloud'),
    Map.addLayer(hicldMask(image).select('pixel_qa'),{palette:'ae00ff'},'pixel_qa high conf cloud'),
    Map.addLayer(lwcirrMask(image).select('pixel_qa'),{palette:'ae00ff'},'pixel_qa low conf cirrus'),
    Map.addLayer(hicirrMask(image).select('pixel_qa'),{palette:'ae00ff'},'pixel_qa high conf cirrus'),
    Map.addLayer(terrOccMask(image).select('pixel_qa'),{palette:'ae00ff'},'pixel_qa terrain occlusion'))
}
//-----------------------------------------------------------------------------------------------------------------------------///

//------------------------------- Chart Plotting Functions --------------------------------------------------------------------///
// Plot a time series of an image collections' band values at a ROI (point).
exports.TSpt = function(imgcol, roi, band, title){
  var chart = ui.Chart.image.series(imgcol.select(band), roi)
    .setChartType('ScatterChart')
    .setOptions({
      title: title,
      lineWidth: 1,
      pointSize: 3,
    });
  return chart;
};

// Plot a time series of an image collections' band values at a ROI (point) with linear trendline.
exports.TSpt_linfit = function(imgcol, roi, band, title){
  var chart = ui.Chart.image.series(imgcol.select(band), roi)
    .setChartType('ScatterChart')
    .setOptions({
      title: title,
      trendlines: {0: {
        color: 'CC0000'
      }},
      lineWidth: 1,
      pointSize: 3,
    });
  return chart;
};

// Plot a time series of an image collections' band values (sum) by an ROI(s) (polygon(s)).
exports.TSroiMean = function(imgcol, band, rois, scale, title){
  var chart = ui.Chart.image.seriesByRegion({
    imageCollection: imgcol, 
    band: band,
    regions: rois,
    reducer: ee.Reducer.mean(),
    scale: scale
  })
  .setChartType('ScatterChart')
  .setOptions({
    title: title,
    lineWidth: 2,
    pointSize: 2,
  });
  return chart;
};

// Plot a time series of an image collections' band values (sum) by an ROI(s) (polygon(s)).
exports.TSroiSum = function(imgcol, band, rois, scale, title){
  var chart = ui.Chart.image.seriesByRegion({
    imageCollection: imgcol, 
    band: band,
    regions: rois,
    reducer: ee.Reducer.sum(),
    scale: scale
  })
  .setChartType('ScatterChart')
  .setOptions({
    title: title,
    lineWidth: 2,
    pointSize: 2,
  });
  return chart;
};

// Calculate the fraction coverage of a single ROI feature by an entire image collection, plot results as line-scatter time series
exports.fracCovgChart1 = function(imgcol,band,roi,finalScale,title){
function fraccovgcol1(band,roi){
  var roiarea = roi.area();
  function wrap(image){
    image = image.addBands(ee.Image.pixelArea());
    image = image.addBands(image.select(band).rename('const').divide(image.select(band)));
    image = image.addBands(image.select('const').rename('roiarea').multiply(image.select('area')).divide(roiarea));
    return image;
  }
    return wrap;
  }

  imgcol = imgcol.map(fraccovgcol1(band,roi));

  return ui.Chart.image.seriesByRegion({
    imageCollection: imgcol, 
    band: 'roiarea',
    regions: roi,
    reducer: ee.Reducer.sum(),
    scale: finalScale
  })
  .setChartType('ScatterChart')
  .setOptions({
    title: title,
    lineWidth: 1,
    pointSize: 3,
  });
}

// Calculate the fraction coverage of a set of ROI features by an entire image collection, plot results as line-scatter time series
exports.fracCovgChartMulti = function (imgcol, band, rois, finalScale, title){
  //Calculate area (m2) of each feature in feature collection, store as property
  function feat_area(feature){
    var f_area = feature.geometry().area();
    return feature.setMulti({Area_m2: f_area})
  }
  rois = rois.map(feat_area);

  //Convert feature collection to an image with overlapping pixel values equal to each feature's total area
  var featimg = rois
  .reduceToImage({
    properties: ['Area_m2'],
    reducer: ee.Reducer.first()})
    .select('first')
    .rename('feat_area_m2');

  // Define function to create a pixel area band scaled to the total area of each overlapping feature
  function fraccovgcol(band,roi,featimg){
  function wrap(image){
    image = image.addBands(ee.Image.pixelArea());
    image = image.addBands(image.select(band).rename('const').divide(image.select(band)));
    image = image.addBands(image.select('const').rename('feat_area_m2').multiply(featimg.select('feat_area_m2')));
    image = image.addBands(image.select('const').rename('roiarea').multiply(image.select('area')).divide(image.select('feat_area_m2')));
    return image;
  }
    return wrap;
  }

  //Map over all images in collection to create band ready for use in a reducer 
  imgcol = imgcol.map(fraccovgcol(band,rois,featimg));

  return ui.Chart.image.seriesByRegion({
  imageCollection: imgcol, 
  band: 'roiarea',
  regions: rois,
  reducer: ee.Reducer.sum(),
  scale: finalScale
  })
  .setChartType('ScatterChart')
  .setOptions({
    title: title,
    lineWidth: 1,
    pointSize: 3,
  });
}
//-----------------------------------------------------------------------------------------------------------------------------///

//------------------------------- Band Math Functions -------------------------------------------------------------------------///
//Add image date to each pixel in image as new band
exports.addDate = function(image){
  var datenum = ee.Number.parse(image.date().format("YYYYMMdd"));
  return image.addBands(ee.Image.constant(datenum).rename('Date'));
};

// Add values from two bands
exports.add2bands = function(band1,band2,newname) {
  function wrap(image){
  return image.addBands(image.select(band1).rename(newname).add(image.select(band2)));
  }
  return wrap;
};

// Subtract values from two bands
exports.subtr2bands = function(band1,band2,newname) {
  function wrap(image){
  return image.addBands(image.select(band1).rename(newname).subtract(image.select(band2)));
  }
  return wrap;
};

// Multiply values from two bands
exports.mult2bands = function(band1,band2,newname) {
  function wrap(image){
  return image.addBands(image.select(band1).rename(newname).multiply(image.select(band2)));
  }
  return wrap;
};

// Divide values from two bands
exports.div2bands = function(band1,band2,newname) {
  function wrap(image){
  return image.addBands(image.select(band1).rename(newname).divide(image.select(band2)));
  }
  return wrap;
};

//Calculate and add NDVI band to image
exports.addNDVI = function(NIRband,Redband) {
function wrap(image){
return image.addBands(image.normalizedDifference([NIRband,Redband]).rename('NDVI'));
}
return wrap;
};

//Calculate and add GNDVI band to image
exports.addGNDVI = function(NIRband,Greenband) {
  function wrap(image){
  return image.addBands(image.normalizedDifference([NIRband,Greenband]).rename('GNDVI'));
  }
  return wrap;
  };

//Calculate and add NDWI (McFeeters) band to image
exports.addNDWI_MF = function(Greenband,NIRband) {
  function wrap(image){
  return image.addBands(image.normalizedDifference([Greenband,NIRband]).rename('NDWI_MF'));
  }
  return wrap;
  };

//Calculate and add NDWI (Gao SWIR 1) band to image
exports.addNDWI_G1 = function(NIRband,SWIR1240band) {
  function wrap(image){
  return image.addBands(image.normalizedDifference([NIRband,SWIR1240band]).rename('NDWI_G1'));
  }
  return wrap;
  };

//Calculate and add NDWI (Gao SWIR 2) band to image
exports.addNDWI_G2 = function(NIRband,SWIR1640band) {
  function wrap(image){
  return image.addBands(image.normalizedDifference([NIRband,SWIR1640band]).rename('NDWI_G2'));
  }
  return wrap;
  };

//Calculate and add NDWI (Gao SWIR 3) band to image
exports.addNDWI_G3 = function(NIRband,SWIR2130band) {
  function wrap(image){
  return image.addBands(image.normalizedDifference([NIRband,SWIR2130band]).rename('NDWI_G3'));
  }
  return wrap;
  };

//Calculate and add MNDWI band to image
exports.addMNDWI = function(Greenband,SWIR1240band) {
  function wrap(image){
  return image.addBands(image.normalizedDifference([Greenband,SWIR1240band]).rename('MNDWI'));
  }
  return wrap;
  };

//Calculate and add Floating Algae Index (FAI) band to image
exports.addFAI = function(NIRband,Redband,SWIR1240band) {
  function wrap(image){
  return image.addBands(image.expression(
    'R859 - (R645 + (R1240 - R645) * (859-645)/(1240-645))', {
      'R859': image.select(NIRband),
      'R645': image.select(Redband),
      'R1240': image.select(SWIR1240band)
    }).rename('FAI'));
  }
  return wrap;
  };

//Calculate and add NMDI (Normalized Multiband Drought Index) band to image
exports.addNMDI = function(NIRband,SWIR1640band,SWIR2130band) {
  function wrap(image){
  return image.addBands(image.expression(
    '(NIR - (SWIR1640 - SWIR2130)) / (NIR + (SWIR1640 - SWIR2130))', {
      'NIR': image.select(NIRband),
      'SWIR1640': image.select(SWIR1640band),
      'SWIR2130': image.select(SWIR2130band),
    }).rename('NMDI'));
  }
  return wrap;
  };

//Add a constant value band to an image
exports.addConstant = function(constValue, bandName) {
function wrap(image){
  return image.addBands(ee.Image.constant(constValue).rename(bandName));
}
return wrap;
};
//------------------------------------------------------------------------------------------------------------------------------///

//------------------------------- Projection Functions -------------------------------------------------------------------------///
exports.toWGS = function(image){
var props = image.propertyNames();
var scale = image.projection().nominalScale();
return image.reproject('EPSG:4326').copyProperties(image,props);
};

exports.toNAD83 = function(image){
var props = image.propertyNames();
var scale = image.projection().nominalScale();
return image.reproject('EPSG:4269').copyProperties(image,props);
};
//------------------------------------------------------------------------------------------------------------------------------///

//------------------------------- Feature Geometry Functions -------------------------------------------------------------------------///
// This function creates a new feature from the centroid of the geometry.
exports.getCentroid = function(feature) {
  // Keep this list of properties.
  var props  = feature.propertyNames();

  // Get the centroid of the feature's geometry.
  var centroid = feature.geometry().centroid();

  // Return a new Feature, copying properties from the old Feature.
  return ee.Feature(centroid).copyProperties(feature, props);
};

// Calculate the area (m2) of a feature polygon and store it as a property.  Can be mapped over a feature collection
exports.feat_area = function(feature){
var feat_area = feature.geometry().area();
return feature.setMulti({Area_m2: feat_area})
}

// Calculate the fraction of a given single ROI feature covered by a given image (single). Outputs a single number (0 to 1)
exports.fracCovgNum = function(image,band,roi){
var roiarea = roi.area();
image = image.addBands(ee.Image.pixelArea());
image = image.addBands(image.select(band).rename('const').divide(image.select(band)));
image = image.addBands(image.select('const').rename('pxarea').multiply(image.select('area')));
var res = image.select(band).projection().nominalScale();
var pxarea = image.select('pxarea').reduceRegion(ee.Reducer.sum(),roi,res).get('pxarea');
return ee.Number(pxarea).divide(roiarea);
}

// Returns an image collection with the 'roiarea' band to be used in any fraction coverage reductions (such as for charts or exporting table to CSV)
exports.fracCovgImgCol = function(imgcol, rois, band){

  //Calculate area of each feature in feature collection, store as property
  function feat_area(feature){
    var f_area = feature.geometry().area();
    return feature.setMulti({Area_m2: f_area})
  }
  rois = rois.map(feat_area);

  //Convert feature collection to an image with overlapping pixel values equal to each feature's total area
  var featimg = rois
  .reduceToImage({
    properties: ['Area_m2'],
    reducer: ee.Reducer.first()})
  .select('first')
  .rename('feat_area_m2');

  // Define function to create a pixel area band scaled to the total area of each overlapping feature
  function fraccovgcol(band,roi,featimg){
    function wrap(image){
      image = image.addBands(ee.Image.pixelArea());
      image = image.addBands(image.select(band).rename('const').divide(image.select(band)));
      image = image.addBands(image.select('const').rename('feat_area_m2').multiply(featimg.select('feat_area_m2')));
      image = image.addBands(image.select('const').rename('roiarea').multiply(image.select('area')).divide(image.select('feat_area_m2')));
      return image;
    }
    return wrap;
  }
//Map over all images in collection to create band ready for use in a reducer 
return imgcol.map(fraccovgcol(band,rois,featimg));
}

//
// Perform WEIGHTED-SUM Reduction on an image collection for a setg of ROI features and export time series as a table to CSV to Google Drive.  Outputs a feature collection table ready for export.
// Arguments: imgcol = image collection; band = band of image collection to assess coverage; rois = ROI feature collection; roiprop = [MUST BE A STRING] property of ROIs to use as column headers in output CSV, scale = scale of reduction to use
exports.redRegTable_sum = function(imgcol,band,rois,roiprop,scale){
// Ensure the roiprop in the feature collection is a string format 
// var rois_sprop = rois.map(function(f){
//   f = f.set(roiprop,ee.String(f.get(roiprop)));
//   return f;
// })

var triplets = imgcol.map(function(image) {
  return image.select(band).reduceRegions({
    collection: rois.select([roiprop]), 
    reducer: ee.Reducer.sum(), 
    scale: scale
  }).filter(ee.Filter.neq('sum', null))
    .map(function(f) { 
      f = f.set('imageId', image.id());
      f = f.set('imageDate', image.date().format("YYYY-MM-dd"));
      return f;
    });
}).flatten();

var format = function(table, rowId, colId) {
  var rows = table.distinct(rowId); 
  var joined = ee.Join.saveAll('matches').apply({
    primary: rows, 
    secondary: table, 
    condition: ee.Filter.equals({
      leftField: rowId, 
      rightField: rowId
    })
  });

  return joined.map(function(row) {
      var values = ee.List(row.get('matches'))
        .map(function(feature) {
          feature = ee.Feature(feature);
          return [feature.get(colId), feature.get('sum')];
        });
      return row.select([rowId]).set(ee.Dictionary(values.flatten()));
    });
};
var out = format(triplets, 'imageId', roiprop)

// drop .geo column (not needed if goal is tabular data)
return out.select(['.*'],null,false);
}

// Perform WEIGHTED-MEAN Reduction on an image collection for a setg of ROI features and export time series as a table to CSV to Google Drive.  Outputs a feature collection table ready for export.
// Arguments: imgcol = image collection; band = band of image collection to assess coverage; rois = ROI feature collection; roiprop = [MUST BE A STRING] property of ROIs to use as column headers in output CSV, scale = scale of reduction to use
exports.redRegTable_mean = function(imgcol,band,rois,roiprop,scale){
  // Ensure the roiprop in the feature collection is a string format
// var rois_sprop = rois.map(function(f){
//   f = f.set(roiprop,ee.String(f.get(roiprop)));
//   return f;
// })

  var triplets = imgcol.map(function(image) {
    return image.select(band).reduceRegions({
      collection: rois.select([roiprop]), 
      reducer: ee.Reducer.mean(), 
      scale: scale
    })
    .filter(ee.Filter.neq('mean', null))
      .map(function(f) { 
        f = f.set('imageId', image.id());
        f = f.set('imageDate', image.date().format("YYYY-MM-dd"));
        return f;
      });
  }).flatten();
  
  var format = function(table, rowId, colId) {
    var rows = table.distinct(rowId); 
    var joined = ee.Join.saveAll('matches').apply({
      primary: rows, 
      secondary: table, 
      condition: ee.Filter.equals({
        leftField: rowId, 
        rightField: rowId
      })
    });
  
    return joined.map(function(row) {
        var values = ee.List(row.get('matches'))
          .map(function(feature) {
            feature = ee.Feature(feature);
            return [feature.get(colId), feature.get('mean')];
          });
        return row.select([rowId]).set(ee.Dictionary(values.flatten()));
      });
  };
  var out = format(triplets, 'imageId', roiprop)
  
  // drop .geo column (not needed if goal is tabular data)
  return out.select(['.*'],null,false);
  }

// Perform COUNT Reduction on an image collection for a setg of ROI features and export time series as a table to CSV to Google Drive.  Outputs a feature collection table ready for export.
// Arguments: imgcol = image collection; band = band of image collection to assess coverage; rois = ROI feature collection; roiprop = [MUST BE A STRING] property of ROIs to use as column headers in output CSV, scale = scale of reduction to use
exports.redRegTable_count = function(imgcol,band,rois,roiprop,scale){
// Ensure the roiprop in the feature collection is a string format
// var rois_sprop = rois.map(function(f){
//   f = f.set(roiprop,ee.String(f.get(roiprop)));
//   return f;
// })

  var triplets = imgcol.map(function(image) {
    return image.select(band).reduceRegions({
      collection: rois.select([roiprop]), 
      reducer: ee.Reducer.count(), 
      scale: scale
    })
    .filter(ee.Filter.neq('count', null))
      .map(function(f) { 
        f = f.set('imageId', image.id());
        f = f.set('imageDate', image.date().format("YYYY-MM-dd"));
        return f;
      });
  }).flatten();
  
  var format = function(table, rowId, colId) {
    var rows = table.distinct(rowId); 
    var joined = ee.Join.saveAll('matches').apply({
      primary: rows, 
      secondary: table, 
      condition: ee.Filter.equals({
        leftField: rowId, 
        rightField: rowId
      })
    });
  
    return joined.map(function(row) {
        var values = ee.List(row.get('matches'))
          .map(function(feature) {
            feature = ee.Feature(feature);
            return [feature.get(colId), feature.get('count')];
          });
        return row.select([rowId]).set(ee.Dictionary(values.flatten()));
      });
  };
  var out = format(triplets, 'imageId', roiprop)
  
  // drop .geo column (not needed if goal is tabular data)
  return out.select(['.*'],null,false);
  }
//------------------------------- Export Functions -------------------------------------------------------------------------///
// Export a table to a CSV in Google Drive
// tab = feature collection table to be exported (e.g. output from redRegTable() function); desc = file description string; filePrefix = file prefix string
exports.tab2csv = function(tab, desc, filePrefix){
  return Export.table.toDrive({
  collection: tab, 
  description: desc, 
  fileNamePrefix: filePrefix,
  fileFormat: 'CSV'
  });
}
//--------------------------------------------------------------------------------------------------------------------------///
//------------------------------- Cloud Mask Functions -------------------------------------------------------------------------///
// Cloud Mask function for Landsat 5 and 7 SR imagery (masks "cloud", "cloud shadow" in pixel_qa band and "cloud", "cloud shadow" and "adjacent to cloud" in sr_cloud_qa band)
exports.ls457_cMask = function(image){
    var cfmask1 = image.select('pixel_qa');   
    var cfmask2 = image.select('sr_cloud_qa');
    return image.updateMask(
      cfmask1.neq(72).and 
      (cfmask1.neq(136)).and
      (cfmask1.neq(96)).and
      (cfmask1.neq(112)).and
      (cfmask1.neq(160)).and
      (cfmask1.neq(176)).and
      (cfmask1.neq(224)).and
      (cfmask2.neq(2)).and
      (cfmask2.neq(34)).and
      (cfmask2.neq(4)).and
      (cfmask2.neq(12)).and
      (cfmask2.neq(20)).and
      (cfmask2.neq(36)).and
      (cfmask2.neq(52)).and
      (cfmask2.neq(8)).and
      (cfmask2.neq(24)).and
      (cfmask2.neq(40)).and
      (cfmask2.neq(56)));       
}

// Cloud Mask function for Landsat 8 SR imagery ('Cloud' and 'Cloud Shadow' codes from pixel_qa band)
exports.ls8_cMask = function(image){
  var cfmask1 = image.select('pixel_qa');   
  return image.updateMask(
    cfmask1.neq(328).and 
    (cfmask1.neq(392)).and
    (cfmask1.neq(840)).and
    (cfmask1.neq(904)).and
    (cfmask1.neq(1350)).and
    (cfmask1.neq(352)).and
    (cfmask1.neq(368)).and
    (cfmask1.neq(416)).and
    (cfmask1.neq(432)).and
    (cfmask1.neq(480)).and
    (cfmask1.neq(864)).and
    (cfmask1.neq(880)).and
    (cfmask1.neq(928)).and
    (cfmask1.neq(944)).and
    (cfmask1.neq(992)));       
}

// Cloud Mask function for Sentinel-2 TOA data (from GEE documentation: https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2) using the QA60 band
// exports.s2TOA_cMask = function(image) {
//   var qa = image.select('QA60');

//   // Bits 10 and 11 are clouds and cirrus, respectively.
//   var cloudBitMask = 1 << 10;
//   var cirrusBitMask = 1 << 11;

//   // Both flags should be set to zero, indicating clear conditions.
//   var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
//       .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

//   return image.updateMask(mask).divide(10000);
// }

// Bits 10 and 11 are clouds and cirrus, respectively.

// Map.addLayer(qa.bitwiseAnd(cloudBitMask).neq(0), {}, 'clouds');
// Map.addLayer(qa.bitwiseAnd(cirrusBitMask).neq(0), {}, 'cirrus');

exports.s2TOA_cMask = function(image) {
  var cloudBitMask = ee.Number(2).pow(10).int();
  var cirrusBitMask = ee.Number(2).pow(11).int();
  var qa = image.select('QA60');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(
             qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask);
}

//----------------- DEFINE AND CALC CLOUD MASKS ------------------------------------------//
// First cloud Mask option ("cloud" and "cloud shadow" values in pixel_qa)
exports.ls_cloudMask1 = function(image){
  var cfmask = image.select('pixel_qa');    
  return image.updateMask(
    cfmask.neq(72).and 
    (cfmask.neq(136)).and
    (cfmask.neq(96)).and
    (cfmask.neq(112)).and
    (cfmask.neq(160)).and
    (cfmask.neq(176)).and
    (cfmask.neq(224)));  
}

// Second cloud Mask option ("cloud", "cloud shadow" in pixel_qa and "cloud", "cloud shadow" and "adjacent to cloud" in sr_cloud_qa)
exports.ls_cloudMask2 = function(image){
  var cfmask1 = image.select('pixel_qa');   
  var cfmask2 = image.select('sr_cloud_qa');
  return image.updateMask(
    cfmask1.neq(72).and 
    (cfmask1.neq(136)).and
    (cfmask1.neq(96)).and
    (cfmask1.neq(112)).and
    (cfmask1.neq(160)).and
    (cfmask1.neq(176)).and
    (cfmask1.neq(224)).and
    (cfmask2.neq(2)).and
    (cfmask2.neq(34)).and
    (cfmask2.neq(4)).and
    (cfmask2.neq(12)).and
    (cfmask2.neq(20)).and
    (cfmask2.neq(36)).and
    (cfmask2.neq(52)).and
    (cfmask2.neq(8)).and
    (cfmask2.neq(24)).and
    (cfmask2.neq(40)).and
    (cfmask2.neq(56)));       
}

// Third cloud Mask option (mask all >) (non-"clear") pixels in sr_cloud_qa band)
exports.ls_cloudMask3 = function(image){
var cfmask = image.select('sr_cloud_qa');    
return image.updateMask(cfmask.lt(1));  
}