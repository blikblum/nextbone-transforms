import { Component } from "component"

class ConfigurationSectorsView extends Component {
  initialize(options) {
    this.sectors = options.sectors
    this.modalService = container[MODAL_SERVICE]
  }

  events = {
    'click #sectors--list [data-action-edit]': 'editSectorClick',
    'click #sectors--add-sector': 'addSector'
  };

  editSectorClick(e) {
    e.preventDefault()
    const sector = $(e.currentTarget).closest('tr')[0].sector
    this.editSector(sector)
  }

  addSector() {
    const sector = new Sector()
    this.editSector(sector)
  }

  render() {
    return (
      <div>
      </div>
    )
  }
}

export { ConfigurationSectorsView }