import zipcelx from "zipcelx";

const Util = {
  exportToXLS(rows, fileName) {
      rows = rows.map(function(rowArray) {
        return rowArray.map(cell => ({ value: cell, type: "string" }));
      });
      zipcelx({
        filename: fileName || "Report",
        sheet: {
          data: rows
        }
      });
  }
}

export default Util;