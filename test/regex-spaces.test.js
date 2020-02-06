import eslint from './eslint'

export default async () => expect(await eslint({ 'test.js': 'export default /  /' })).toEqual('')
