const haveSameFields = (array) => {
    if (array.length === 0) return true; // If array is empty, consider it valid
  
    // Get the keys from the first object to use as a reference
    const referenceKeys = Object.keys(array[0]);
  
    // Check each object to see if it has the same keys as the reference
    return array.every(obj => {
        const keys = Object.keys(obj);
        return (
            keys.length === referenceKeys.length &&   // Same number of keys
            keys.every(key => referenceKeys.includes(key)) // Same keys
        );
    });
}

module.exports = { haveSameFields };