import Blog from '@/models/Blog';
import Category from '@/models/Category';
import Course from '@/models/Course';
import CourseCategory from '@/models/CourseCategory';
import Event from '@/models/Event';
import Homepage from '@/models/Homepage';
import Infographic from '@/models/Infographic';
import Membership from '@/models/Membership';
import Product from '@/models/Product';
import ProductCategory from '@/models/ProductCategory';
import Recipe from '@/models/Recipe';
import RecipeCategory from '@/models/RecipeCategory';
import Resource from '@/models/Resource';
import ResourceCategory from '@/models/ResourceCategory';
import Team from '@/models/Team';
import Tool from '@/models/Tool';
import ToolCategory from '@/models/ToolCategory';

// Deliberately inspect persisted content instead of adding fragile references
// to every existing schema. This protects legacy uploads without a migration.
const SOURCES = [
  ['Blog', Blog, 'title'], ['Blog category', Category, 'name'], ['Course', Course, 'title'],
  ['Course category', CourseCategory, 'name'], ['Event', Event, 'title'], ['Homepage', Homepage, null],
  ['Infographic', Infographic, 'title'], ['Membership', Membership, 'name'], ['Product', Product, 'name'],
  ['Product category', ProductCategory, 'name'], ['Recipe', Recipe, 'title'], ['Recipe category', RecipeCategory, 'name'],
  ['Resource', Resource, 'title'], ['Resource category', ResourceCategory, 'name'], ['Team member', Team, 'name'],
  ['Tool', Tool, 'title'], ['Tool category', ToolCategory, 'name'],
];

function containsUrl(value, url) {
  if (typeof value === 'string') return value === url || value.includes(`\"${url}\"`);
  // Lean Mongo ObjectIds do not expose their bytes through Object.values(),
  // so compare their canonical form before recursively walking plain data.
  if (value && typeof value.toString === 'function' && value.toString() === url) return true;
  if (Array.isArray(value)) return value.some((item) => containsUrl(item, url));
  if (value && typeof value === 'object') return Object.values(value).some((item) => containsUrl(item, url));
  return false;
}

export async function findMediaUsage(media) {
  const needles = [media.url, media._id?.toString()].filter(Boolean);
  const groups = await Promise.all(SOURCES.map(async ([label, Model, nameField]) => {
    const docs = await Model.find({}).lean();
    return docs.filter((doc) => needles.some((needle) => containsUrl(doc, needle))).map((doc) => ({
      model: label,
      id: doc._id.toString(),
      label: nameField ? (doc[nameField] || 'Untitled') : 'Homepage settings',
    }));
  }));
  return groups.flat();
}
