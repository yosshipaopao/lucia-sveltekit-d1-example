export const isValidString = (
	value: unknown,
	min: number = -1,
	max: number = -1
): value is string => {
	if (typeof value != 'string') return false;
	if (min != -1 && value.length < min) return false;
	if (max != -1 && value.length > max) return false;
	return true;
};
