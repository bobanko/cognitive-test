/**
 *
 * @param {string} str string to get hashed/random value based on
 * @param {number} max number of variations to choose from
 * @returns random number based on string provided, in range from 0 to max
 */
export function getHashNum(str = "", max = 0) {
  // todo(vmyshko): code from https://gist.github.com/0x263b/2bdd90886c2036a1ad5bcf06d6e6fb37
  let hash = 0;
  if (str.length === 0) return hash;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  hash = ((hash % max) + max) % max;

  return hash;
}
