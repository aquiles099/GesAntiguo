import { isset } from './helpers';

export class ObjectUtility
{
	public static simpleCloning(object:Object):any
	{
		return JSON.parse(JSON.stringify(object));
	}
	
	public static complexCloning(object:Object):any
	{
		const clone = {};

		for(let [key, value] of Object.entries(object))
		{
			clone[key] = ObjectUtility.isANativeObject(value) ? ObjectUtility.complexCloning(value) : value; 
		}

		return clone;
	}
	
	public static areEquals(obj1:Object, obj2:Object):boolean
	{
		return JSON.stringify(obj1) === JSON.stringify(obj2);
	}

	public static hasNoNullValues(object:Object):any
	{
		return Object.values(object).every(value => isset(value));
	}

	public static overrideValues(object:Object):any
	{
		Object.keys(object).forEach(key => {
			
			object[key] = ObjectUtility.isANativeObject(object[key]) ?
			ObjectUtility.overrideValues(object[key]) :
			Array.isArray(object[key]) ? [] : null;
			
		});

		return object;
	}

	public static isANativeObject(_any:any):boolean
	{
		return _any !== null && typeof _any === 'object' && _any.constructor.name === "Object";
	}

}
