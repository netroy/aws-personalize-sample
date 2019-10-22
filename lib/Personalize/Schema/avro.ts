
export interface IAvroFields {
  name: string
  type: 'boolean' | 'int' | 'long' | 'float' | 'double' | 'string'
  categorical?: boolean
}

type SchemaName = 'Users' | 'Items' | 'Interactions'

export class AvroSchema {
  private name: SchemaName
  private fields: IAvroFields[]
  private type = 'record'
  private version = '1.0'

  constructor(name: SchemaName, fields: IAvroFields[]) {
    this.name = name
    this.fields = fields
  }

  public extend(fields: IAvroFields[]) {
    fields.forEach((f) => {
      // All custom string fields have to be categorial
      if (f.type === 'string') {
        f.categorical = true
      }
    })
    return new AvroSchema(this.name, this.fields.slice(0).concat(fields))
  }

  public toJSON() {
    return JSON.stringify({
      type: this.type,
      name: this.name,
      namespace: 'com.amazonaws.personalize.schema',
      fields: this.fields,
      version: this.version
    })
  }
}
